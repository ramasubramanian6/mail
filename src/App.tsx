import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Mail, CheckCircle, XCircle, AlertCircle, Users, Clock, Zap } from 'lucide-react';

interface ProcessingStatus {
  total: number;
  success: number;
  failed: number;
  processing: boolean;
  currentIndex?: number;
  errors?: string[];
}

interface UploadResponse {
  message: string;
  filename: string;
  path: string;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        setFile(droppedFile);
      } else {
        alert('Please upload only .xlsx files');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('excel', file);

    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: UploadResponse = await response.json();
      setUploadedFile(data.filename);
      
      // Start processing
      await handleProcess(data.filename);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async (filename: string) => {
    setProcessing(true);
    setStatus({ total: 0, success: 0, failed: 0, processing: true });

    try {
      // Simulate processing with mock data for demo
      const mockData = [
        { name: 'John Doe', phone: '9876543210', email: 'john@example.com' },
        { name: 'Jane Smith', phone: '9876543211', email: 'jane@example.com' },
        { name: 'Bob Johnson', phone: '9876543212', email: 'bob@example.com' },
        { name: 'Alice Brown', phone: '9876543213', email: 'alice@example.com' },
        { name: 'Charlie Davis', phone: '9876543214', email: 'charlie@example.com' }
      ];

      setStatus({ total: mockData.length, success: 0, failed: 0, processing: true });

      // Simulate processing each record
      for (let i = 0; i < mockData.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
        
        const success = Math.random() > 0.2; // 80% success rate
        setStatus(prev => ({
          ...prev!,
          success: prev!.success + (success ? 1 : 0),
          failed: prev!.failed + (success ? 0 : 1),
          currentIndex: i + 1
        }));
      }

      setStatus(prev => ({ ...prev!, processing: false }));

    } catch (error) {
      console.error('Processing error:', error);
      setStatus(prev => ({ ...prev!, processing: false }));
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setUploadedFile(null);
    setStatus(null);
    setProcessing(false);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Mail className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Personalized Bulk Email System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your Excel file and automatically generate personalized investment cards 
            for each recipient with bulk email delivery.
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Upload Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Upload className="w-6 h-6 mr-3 text-blue-500" />
              Upload Excel File
            </h2>
            
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-800 mb-2">Required Excel Format:</h3>
                <div className="text-sm text-blue-700">
                  <p>Your Excel file should contain these columns:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><strong>Column A:</strong> Name</li>
                    <li><strong>Column B:</strong> Phone</li>
                    <li><strong>Column C:</strong> Email</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              
              {file ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-700 font-medium">{file.name}</span>
                    </div>
                    <p className="text-sm text-green-600 mt-2">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  
                  <div className="flex space-x-4 justify-center">
                    <button
                      onClick={handleUpload}
                      disabled={uploading || processing}
                      className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
                    >
                      {uploading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          <span>Process File</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={resetForm}
                      className="bg-gray-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors duration-200"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-lg text-gray-600">
                    Drag and drop your Excel file here
                  </p>
                  <p className="text-gray-500">or</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                  >
                    Browse Files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Processing Status */}
          {status && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <AlertCircle className="w-6 h-6 mr-3 text-orange-500" />
                Processing Status
              </h2>

              {/* Progress Bar */}
              {status.processing && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Processing records...</span>
                    <span>{status.currentIndex || 0} of {status.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((status.currentIndex || 0) / status.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Records</p>
                      <p className="text-3xl font-bold text-blue-800">{status.total}</p>
                    </div>
                    <Users className="w-12 h-12 text-blue-500" />
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Successful</p>
                      <p className="text-3xl font-bold text-green-800">{status.success}</p>
                    </div>
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 font-medium">Failed</p>
                      <p className="text-3xl font-bold text-red-800">{status.failed}</p>
                    </div>
                    <XCircle className="w-12 h-12 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Completion Message */}
              {!status.processing && (
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center space-x-2 text-green-600">
                    <CheckCircle className="w-6 h-6" />
                    <span className="text-lg font-medium">Processing Complete!</span>
                  </div>
                  <p className="text-gray-600 mt-2">
                    {status.success} emails sent successfully, {status.failed} failed.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p>⚡ Powered by React, Node.js, and Canvas API</p>
        </div>
      </div>
    </div>
  );
}

export default App;