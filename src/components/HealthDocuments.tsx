import { useState, useEffect } from 'react';
import { Upload, File, Trash2, Calendar, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HealthDocument {
  id: string;
  document_name: string;
  document_type: string;
  document_url: string;
  upload_date: string;
  notes: string;
}

export default function HealthDocuments() {
  const [documents, setDocuments] = useState<HealthDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState('prescription');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('health_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('upload_date', { ascending: false });

    if (data) {
      setDocuments(data);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please sign in to upload documents');
      return;
    }

    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('health-documents')
      .upload(fileName, file);

    if (uploadError) {
      alert('Failed to upload file. Please try again.');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('health-documents')
      .getPublicUrl(fileName);

    const { error: dbError } = await supabase
      .from('health_documents')
      .insert({
        user_id: user.id,
        document_name: file.name,
        document_type: documentType,
        document_url: fileName,
        notes: notes
      });

    setUploading(false);

    if (dbError) {
      alert('Failed to save document info. Please try again.');
    } else {
      setNotes('');
      loadDocuments();
    }

    event.target.value = '';
  };

  const handleDelete = async (docId: string, docUrl: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    const { error: storageError } = await supabase.storage
      .from('health-documents')
      .remove([docUrl]);

    const { error: dbError } = await supabase
      .from('health_documents')
      .delete()
      .eq('id', docId);

    if (!storageError && !dbError) {
      loadDocuments();
    } else {
      alert('Failed to delete document. Please try again.');
    }
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'prescription': return 'bg-blue-100 text-blue-700';
      case 'lab_report': return 'bg-green-100 text-green-700';
      case 'scan': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'prescription': return 'Prescription';
      case 'lab_report': return 'Lab Report';
      case 'scan': return 'Medical Scan';
      default: return 'Other';
    }
  };

  const viewDocument = async (docUrl: string) => {
    const { data } = await supabase.storage
      .from('health-documents')
      .createSignedUrl(docUrl, 3600);

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <File className="w-8 h-8 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-800">Health Documents</h2>
      </div>

      <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-6">
        <p className="text-green-800 text-sm">
          Upload your previous health records, prescriptions, lab reports, and medical scans. These documents help us provide better recommendations.
        </p>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="prescription">Prescription</option>
              <option value="lab_report">Lab Report</option>
              <option value="scan">Medical Scan</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any relevant notes about this document..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <label className="flex flex-col items-center justify-center px-6 py-8 cursor-pointer hover:bg-gray-100 transition-colors rounded-lg">
            <Upload className="w-12 h-12 text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-700">
              {uploading ? 'Uploading...' : 'Click to upload document'}
            </span>
            <span className="text-xs text-gray-500 mt-1">
              PDF, JPG, PNG (Max 10MB)
            </span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">Your Documents ({documents.length})</h3>

        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <File className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No documents uploaded yet</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-green-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <File className="w-5 h-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-800">{doc.document_name}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getDocumentTypeColor(doc.document_type)}`}>
                      {getDocumentTypeLabel(doc.document_type)}
                    </span>
                  </div>

                  {doc.notes && (
                    <p className="text-sm text-gray-600 mb-2">{doc.notes}</p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-4 h-4" />
                    {new Date(doc.upload_date).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => viewDocument(doc.document_url)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="View document"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id, doc.document_url)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
