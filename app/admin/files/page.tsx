'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle, Loader2 } from 'lucide-react';

export default function AdminFilesPage() {
  // Simple admin protection - in production, implement proper authentication
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminKey, setAdminKey] = useState('');

  useEffect(() => {
    // Check if admin key is stored in localStorage
    const storedKey = localStorage.getItem('admin-key');
    if (storedKey === 'base-daily-admin-2024') {
      setIsAdmin(true);
    }
  }, []);

  const handleAdminLogin = () => {
    if (adminKey === 'base-daily-admin-2024') {
      localStorage.setItem('admin-key', adminKey);
      setIsAdmin(true);
    } else {
      alert('Invalid admin key');
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Admin Access</CardTitle>
              <CardDescription>
                Enter admin key to access file upload functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="adminKey">Admin Key</Label>
                <Input
                  id="adminKey"
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Enter admin key"
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Demo key: <code className="bg-muted px-1 rounded">base-daily-admin-2024</code>
                </p>
              </div>
              <Button onClick={handleAdminLogin} className="w-full">
                Access Admin Panel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priceUsd: '1',
    recipient: process.env.NEXT_PUBLIC_PAYWALL_RECIPIENT || '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!formData.title || !formData.description || !formData.recipient) {
      setError('Please fill in all required fields');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('priceUsd', formData.priceUsd);
      uploadFormData.append('recipient', formData.recipient);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadSuccess(true);
        setFormData({
          title: '',
          description: '',
          priceUsd: '1',
          recipient: process.env.NEXT_PUBLIC_PAYWALL_RECIPIENT || '',
        });
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin - Upload Files</h1>
            <p className="text-muted-foreground">
              Upload PDF files for pay-per-download functionality
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              localStorage.removeItem('admin-key');
              setIsAdmin(false);
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      <Alert className="mb-6">
        <AlertDescription>
          <strong>Note:</strong> File uploads to /public are ephemeral on Vercel. 
          For production, consider using AWS S3 or similar cloud storage.
        </AlertDescription>
      </Alert>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Upload New File</CardTitle>
            <CardDescription>
              Upload a PDF file and set its pricing information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="file">PDF File *</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="mt-1"
                />
                {file && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter file title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter file description"
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="priceUsd">Price (USDC) *</Label>
                <Input
                  id="priceUsd"
                  name="priceUsd"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.priceUsd}
                  onChange={handleInputChange}
                  placeholder="1.00"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="recipient">Recipient Address *</Label>
                <Input
                  id="recipient"
                  name="recipient"
                  value={formData.recipient}
                  onChange={handleInputChange}
                  placeholder="0x..."
                  className="mt-1 font-mono"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Address where payments will be sent
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {uploadSuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    File uploaded successfully! It will appear on the files page.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
