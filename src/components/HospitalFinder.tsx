// src/components/HospitalFinder.tsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Building2, Navigation, Phone } from "lucide-react";

/**
 * Assumptions:
 * - Supabase v2 client is used and exported from src/lib/supabase
 * - Tables/columns exist exactly as: hospitals(id, name, address, latitude, longitude, phone, specialities),
 *   user_profiles(id UUID primary key, user_id text linking to auth id),
 *   health_assessments(id, user_id, created_at),
 *   appointments(user_id, hospital_id, assessment_id, notes, status)
 * - There's a unique constraint on (latitude, longitude) or we'll get duplicates.
 */

type HospitalRow = {
  id?: number | string;
  name: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  phone?: string | null;
  specialities?: string | null;
  emergency_available?: boolean;
};

export default function HospitalFinder() {
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [hospitals, setHospitals] = useState<HospitalRow[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // per-hospital UI state for creating appointment notes & processing
  const [openNoteIdx, setOpenNoteIdx] = useState<number | null>(null);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [processingMap, setProcessingMap] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      await requestLocationAndSync().catch((e) => {
        console.error(e);
        setError("Initialization failed: " + (e as Error).message);
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- helpers
  const toKey = (h: Pick<HospitalRow, "latitude" | "longitude">) =>
    `${Number(h.latitude).toFixed(6)}|${Number(h.longitude).toFixed(6)}`;

  const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // --- location + sync
  async function requestLocationAndSync() {
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!navigator.geolocation) {
      setError("Geolocation not supported by this browser.");
      setLoading(false);
      return;
    }

    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setUserLocation({ lat, lon });

          try {
            await syncHospitalsAround(lat, lon, 50000); // 50 km
          } catch (e) {
            console.error("syncHospitalsAround error", e);
            setError("Failed to sync hospitals: " + (e as Error).message);
          } finally {
            setLoading(false);
            resolve();
          }
        },
        (err) => {
          console.error("geolocation error", err);
          setError("Unable to access location. Please allow location access.");
          setLoading(false);
          resolve();
        },
        { enableHighAccuracy: false, maximumAge: 1000 * 60 * 5, timeout: 20000 }
      );
    });
  }

  // Overpass -> upsert into Supabase (chunked)
  async function syncHospitalsAround(lat: number, lon: number, radius = 50000) {
    setSyncing(true);
    setError(null);

    const query = `
      [out:json][timeout:180];
      (
        node["amenity"="hospital"](around:${radius},${lat},${lon});
        way["amenity"="hospital"](around:${radius},${lat},${lon});
        relation["amenity"="hospital"](around:${radius},${lat},${lon});
      );
      out center tags;
    `;

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: query,
    });

    if (!res.ok) {
      setSyncing(false);
      throw new Error("Overpass API error: " + res.statusText);
    }

    const json = await res.json();
    if (!json?.elements || json.elements.length === 0) {
      setHospitals([]);
      setSyncing(false);
      return;
    }

    // Map & dedupe by rounded coords
    const mapped: HospitalRow[] = json.elements
      .map((el: any) => {
        const latVal = el.lat ?? el.center?.lat;
        const lonVal = el.lon ?? el.center?.lon;
        if (!latVal || !lonVal) return null;
        return {
          name: el.tags?.name || "Unnamed Hospital",
          address:
            el.tags?.["addr:full"] ||
            [el.tags?.["addr:street"], el.tags?.["addr:housenumber"], el.tags?.["addr:city"]]
              .filter(Boolean)
              .join(", ") ||
            el.tags?.["description"] ||
            null,
          latitude: Number(latVal),
          longitude: Number(lonVal),
          phone: el.tags?.phone || el.tags?.contact?.phone || null,
          specialities: el.tags?.speciality || el.tags?.healthcare || null,
          emergency_available: !!el.tags?.emergency,
        } as HospitalRow;
      })
      .filter(Boolean);

    const uniq = new Map<string, HospitalRow>();
    for (const h of mapped) {
      uniq.set(toKey(h), h); // last one wins - fine for our use
    }
    const uniqHospitals = Array.from(uniq.values());

    // Chunked upsert
    const chunkSize = 200;
    for (let i = 0; i < uniqHospitals.length; i += chunkSize) {
      const chunk = uniqHospitals.slice(i, i + chunkSize);
      const payload = chunk.map((h) => ({
        name: h.name,
        address: h.address,
        latitude: h.latitude,
        longitude: h.longitude,
        phone: h.phone,
        specialities: h.specialities,
      }));

      const { data, error } = await supabase
        .from("hospitals")
        .upsert(payload, { onConflict: ["latitude", "longitude"], returning: "representation" });

      if (error) {
        console.error("Supabase upsert chunk error", error);
        setError("Supabase upsert error: " + error.message);
        // continue with next chunk but flag the error
      } else if (Array.isArray(data)) {
        // merge returned DB rows into local state
        setHospitals((prev) => {
          const map = new Map<string, HospitalRow>();
          // existing
          for (const p of prev) map.set(toKey(p), p);
          // updated/inserted
          for (const r of data) {
            map.set(`${Number(r.latitude).toFixed(6)}|${Number(r.longitude).toFixed(6)}`, {
              id: r.id,
              name: r.name,
              address: r.address,
              latitude: Number(r.latitude),
              longitude: Number(r.longitude),
              phone: r.phone,
              specialities: r.specialities,
              emergency_available: r.emergency_available ?? false,
            });
          }
          return Array.from(map.values());
        });
      }
    }

    // If DB didn't return rows, fallback to uniqHospitals local representation
    setHospitals((prev) => (prev.length ? prev : uniqHospitals));
    setSyncing(false);
  }

  // --- Appointment creation flow for a specific hospital
  async function createAppointmentFor(h: HospitalRow) {
    const key = toKey(h);
    setProcessingMap((m) => ({ ...m, [key]: true }));
    setMessage(null);

    try {
      // ensure hospital exists and fetch id
      const { data: found, error: findErr } = await supabase
        .from("hospitals")
        .select("id")
        .eq("latitude", h.latitude)
        .eq("longitude", h.longitude)
        .limit(1);

      if (findErr) {
        console.warn("find hospital err", findErr);
      }

      let hospital_id = found && found.length > 0 ? found[0].id : null;

      if (!hospital_id) {
        // insert if not exists
        const { data: ins, error: insErr } = await supabase
          .from("hospitals")
          .insert({
            name: h.name,
            address: h.address,
            latitude: h.latitude,
            longitude: h.longitude,
            phone: h.phone,
            specialities: h.specialities,
          })
          .select()
          .limit(1);

        if (insErr) throw new Error("Failed to create hospital record: " + insErr.message);
        hospital_id = ins && ins[0] && ins[0].id;
      }

      // get authenticated user
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw new Error("Auth fetch error: " + userErr.message);
      const user = userData?.user;
      if (!user) throw new Error("User not authenticated");

      // find user_profiles.id by user_id
      const { data: profileRows, error: profileErr } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (profileErr) console.warn("profile lookup error", profileErr);
      const user_uuid = profileRows && profileRows.length > 0 ? profileRows[0].id : user.id;

      // find latest assessment
      const { data: assessments, error: assessErr } = await supabase
        .from("health_assessments")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (assessErr) console.warn("assessment lookup error", assessErr);
      const assessment_id = assessments && assessments.length > 0 ? assessments[0].id : null;

      // insert appointment
      const note = notesMap[key] ?? null;
      const { data: appt, error: apptErr } = await supabase
        .from("appointments")
        .insert({
          user_id: user_uuid,
          hospital_id,
          assessment_id,
          notes: note,
          status: "pending",
        })
        .select()
        .limit(1);

      if (apptErr) throw new Error("Appointment insert error: " + apptErr.message);

      setMessage("Appointment created (status: pending).");
      // close note UI for that hospital
      setOpenNoteIdx(null);
      setNotesMap((m) => {
        const copy = { ...m };
        delete copy[key];
        return copy;
      });
    } catch (e: any) {
      console.error("createAppointmentFor error", e);
      setMessage("Error creating appointment: " + (e?.message || String(e)));
    } finally {
      setProcessingMap((m) => ({ ...m, [key]: false }));
    }
  }

  // UI helpers
  const handleNoteChange = (h: HospitalRow, value: string) => {
    const key = toKey(h);
    setNotesMap((m) => ({ ...m, [key]: value }));
  };

  // sort hospitals by distance if userLocation present
  const displayed = userLocation
    ? [...hospitals].sort((a, b) => {
        return (
          haversineKm(userLocation.lat, userLocation.lon, a.latitude, a.longitude) -
          haversineKm(userLocation.lat, userLocation.lon, b.latitude, b.longitude)
        );
      })
    : hospitals;

  // --- render
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-8 h-8 text-red-600" />
          <h1 className="text-2xl font-semibold">Hospital Finder & Sync</h1>
        </div>

        <div className="flex gap-3 mb-4">
          <button
            onClick={() => requestLocationAndSync()}
            disabled={loading || syncing}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            <Navigation className="inline-block w-4 h-4 mr-2" />
            {loading ? "Getting location..." : syncing ? "Syncing hospitals..." : "Sync hospitals (50km)"}
          </button>

          <button
            onClick={() => {
              setHospitals([]);
              setMessage(null);
              setOpenNoteIdx(null);
            }}
            className="px-4 py-2 border rounded"
          >
            Clear
          </button>
        </div>

        {error && <div className="text-red-600 mb-3">{error}</div>}
        {message && <div className="text-green-700 mb-3">{message}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayed.length === 0 && !loading && <div className="text-gray-500">No hospitals available.</div>}
          {displayed.map((h, idx) => {
            const dist = userLocation
              ? haversineKm(userLocation.lat, userLocation.lon, h.latitude, h.longitude)
              : null;
            const key = toKey(h);
            const processing = processingMap[key] ?? false;
            return (
              <div key={key} className="bg-white shadow rounded p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{h.name}</h3>
                    {h.emergency_available && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">24/7</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{h.address ?? "Address not available"}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    {h.phone && (
                      <a className="flex items-center gap-1" href={`tel:${h.phone}`}>
                        <Phone className="w-4 h-4" /> {h.phone}
                      </a>
                    )}
                    {dist !== null && <span>{dist.toFixed(1)} km</span>}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <a
                    className="px-3 py-2 bg-blue-600 text-white rounded text-sm"
                    href={`https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Directions
                  </a>

                  <button
                    onClick={() => setOpenNoteIdx((prev) => (prev === idx ? null : idx))}
                    className="px-3 py-2 bg-green-600 text-white rounded text-sm"
                  >
                    {openNoteIdx === idx ? "Close" : "Select for Appointment"}
                  </button>
                </div>

                {openNoteIdx === idx && (
                  <div className="mt-3">
                    <textarea
                      placeholder="Add notes (symptoms, preferred time...)"
                      className="w-full border rounded p-2 mb-2"
                      rows={3}
                      value={notesMap[key] ?? ""}
                      onChange={(e) => handleNoteChange(h, e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => createAppointmentFor(h)}
                        disabled={processing}
                        className="px-3 py-2 bg-indigo-600 text-white rounded"
                      >
                        {processing ? "Creating..." : "Confirm & Create Appointment (pending)"}
                      </button>
                      <button
                        onClick={() => {
                          setOpenNoteIdx(null);
                        }}
                        className="px-3 py-2 border rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}