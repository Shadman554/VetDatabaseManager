import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, AlertCircle, CheckCircle, Database, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const CONTENT_TYPES = [
  { value: 'books', label: 'Books', endpoint: '/api/books' },
  { value: 'diseases', label: 'Diseases', endpoint: '/api/diseases' },
  { value: 'drugs', label: 'Drugs', endpoint: '/api/drugs' },
  { value: 'dictionary', label: 'Dictionary', endpoint: '/api/dictionary' },
  { value: 'staff', label: 'Staff', endpoint: '/api/staff' },
  { value: 'normal-ranges', label: 'Normal Ranges', endpoint: '/api/normal-ranges' },
  { value: 'instruments', label: 'Instruments', endpoint: '/api/instruments' },
  { value: 'notes', label: 'Notes', endpoint: '/api/notes' },
  { value: 'urine-slides', label: 'Urine Slides', endpoint: '/api/urine-slides' },
  { value: 'other-slides', label: 'Other Slides', endpoint: '/api/other-slides' },
  { value: 'stool-slides', label: 'Stool Slides', endpoint: '/api/stool-slides' },
];

const SAMPLE_DATA: Record<string, string> = {
  books: `[
  {
    "title": "Veterinary Anatomy Guide",
    "description": "Comprehensive anatomy reference for veterinary students",
    "category": "Anatomy",
    "download_url": "https://example.com/book1.pdf"
  }
]`,
  diseases: `[
  {
    "name_en": "Canine Parvovirus",
    "name_ku": "ڤایرۆسی پارڤۆ",
    "description_en": "Highly contagious viral infection affecting dogs",
    "description_ku": "نەخۆشییەکی ڤایرۆسی زۆر گواستراوە"
  }
]`,
  drugs: `[
  {
    "name": "Amoxicillin",
    "usage": "Broad-spectrum antibiotic for bacterial infections",
    "side_effects": "Gastrointestinal upset, allergic reactions"
  }
]`,
  dictionary: `[
  {
    "word_en": "Vaccination",
    "word_ku": "کوتان",
    "word_ar": "تطعيم",
    "definition_en": "Administration of vaccine to stimulate immunity",
    "definition_ku": "بەکارهێنانی کوتان بۆ بەهێزکردنی بەرگری",
    "definition_ar": "إعطاء لقاح لتحفيز المناعة"
  }
]`,
  staff: `[
  {
    "name": "Dr. John Smith",
    "position": "Veterinarian",
    "phone": "+1234567890",
    "email": "john.smith@clinic.com"
  }
]`,
  'normal-ranges': `[
  {
    "parameter": "Heart Rate (Dogs)",
    "min_value": 60,
    "max_value": 140,
    "unit": "bpm",
    "species": "Canine"
  }
]`,
  instruments: `[
  {
    "name": "Digital Thermometer",
    "description": "High-precision digital thermometer for animals",
    "category": "Diagnostic"
  }
]`,
  notes: `[
  {
    "title": "Treatment Protocol",
    "content": "Standard protocol for treating acute gastritis in dogs"
  }
]`,
  'urine-slides': `[
  {
    "name": "Normal Canine Urine",
    "description": "Microscopic view of normal dog urine sediment",
    "image_url": "https://example.com/urine1.jpg"
  }
]`,
  'other-slides': `[
  {
    "name": "Blood Smear - Normal",
    "description": "Normal blood cell morphology in dogs",
    "image_url": "https://example.com/blood1.jpg"
  }
]`,
  'stool-slides': `[
  {
    "name": "Parasitic Eggs",
    "description": "Common parasitic eggs found in fecal examination",
    "image_url": "https://example.com/stool1.jpg"
  }
]`
};

export default function BulkUpload() {
  const [selectedType, setSelectedType] = useState<string>('');
  const [jsonData, setJsonData] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async ({ type, data }: { type: string, data: any[] }) => {
      const contentType = CONTENT_TYPES.find(ct => ct.value === type);
      if (!contentType) throw new Error('Invalid content type');

      const results = [];
      for (const item of data) {
        try {
          // Use the external API endpoints directly
          const vetToken = await fetch('/api/vet-auth').then(r => r.json()).then(d => d.token);
          const apiUrl = `https://python-database-production.up.railway.app${contentType.endpoint}`;
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${vetToken}`,
            },
            body: JSON.stringify(item),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          const data = await response.json();
          results.push({ success: true, item, response: data });
        } catch (error) {
          results.push({ success: false, item, error: (error as Error).message });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      toast({
        title: 'Upload Complete',
        description: `${successful} items uploaded successfully${failed > 0 ? `, ${failed} failed` : ''}`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [CONTENT_TYPES.find(ct => ct.value === selectedType)?.endpoint] });
      
      if (successful > 0) {
        setJsonData('');
        setValidationErrors([]);
      }
    },
    onError: (error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const validateJson = (jsonString: string) => {
    const errors: string[] = [];
    
    try {
      const data = JSON.parse(jsonString);
      
      if (!Array.isArray(data)) {
        errors.push('JSON must be an array of objects');
        return errors;
      }
      
      if (data.length === 0) {
        errors.push('Array cannot be empty');
        return errors;
      }
      
      data.forEach((item, index) => {
        if (typeof item !== 'object' || item === null) {
          errors.push(`Item ${index + 1}: Must be an object`);
        }
      });
      
    } catch (e) {
      errors.push('Invalid JSON format');
    }
    
    return errors;
  };

  const handleUpload = () => {
    if (!selectedType) {
      toast({
        title: 'Error',
        description: 'Please select a content type',
        variant: 'destructive',
      });
      return;
    }

    const errors = validateJson(jsonData);
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      return;
    }

    try {
      const data = JSON.parse(jsonData);
      uploadMutation.mutate({ type: selectedType, data });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to parse JSON data',
        variant: 'destructive',
      });
    }
  };

  const loadSampleData = () => {
    if (selectedType && SAMPLE_DATA[selectedType as keyof typeof SAMPLE_DATA]) {
      setJsonData(SAMPLE_DATA[selectedType as keyof typeof SAMPLE_DATA]);
      setValidationErrors([]);
    }
  };

  const downloadTemplate = () => {
    if (selectedType && SAMPLE_DATA[selectedType as keyof typeof SAMPLE_DATA]) {
      const blob = new Blob([SAMPLE_DATA[selectedType as keyof typeof SAMPLE_DATA]], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedType}-template.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Database className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Bulk Data Upload</h1>
          <p className="text-muted-foreground">Upload JSON data directly to the database</p>
        </div>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload">Upload Data</TabsTrigger>
          <TabsTrigger value="templates">Templates & Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload JSON Data
              </CardTitle>
              <CardDescription>
                Select a content type and paste your JSON data to upload multiple records at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Content Type</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select content type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 items-end">
                  <Button
                    variant="outline"
                    onClick={loadSampleData}
                    disabled={!selectedType}
                    className="whitespace-nowrap"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Load Sample
                  </Button>
                  <Button
                    variant="outline"
                    onClick={downloadTemplate}
                    disabled={!selectedType}
                    className="whitespace-nowrap"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">JSON Data</label>
                <Textarea
                  placeholder="Paste your JSON data here..."
                  value={jsonData}
                  onChange={(e) => {
                    setJsonData(e.target.value);
                    if (e.target.value) {
                      setValidationErrors(validateJson(e.target.value));
                    } else {
                      setValidationErrors([]);
                    }
                  }}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">Validation Errors:</div>
                      {validationErrors.map((error, index) => (
                        <div key={index} className="text-sm">• {error}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {jsonData && validationErrors.length === 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    JSON is valid and ready for upload
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleUpload}
                disabled={!selectedType || !jsonData || validationErrors.length > 0 || uploadMutation.isPending}
                className="w-full sm:w-auto"
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload Data'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CONTENT_TYPES.map(type => (
              <Card key={type.value}>
                <CardHeader>
                  <CardTitle className="text-lg">{type.label}</CardTitle>
                  <CardDescription>Sample JSON structure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {SAMPLE_DATA[type.value as keyof typeof SAMPLE_DATA]}
                  </pre>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedType(type.value);
                        setJsonData(SAMPLE_DATA[type.value as keyof typeof SAMPLE_DATA]);
                        setValidationErrors([]);
                      }}
                    >
                      Use Template
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const blob = new Blob([SAMPLE_DATA[type.value as keyof typeof SAMPLE_DATA]], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${type.value}-template.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}