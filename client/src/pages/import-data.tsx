import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Database, AlertCircle, CheckCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ImportResult {
  file: string;
  status: 'success' | 'error' | 'processing';
  message: string;
  count?: number;
}

export default function ImportData() {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter(file => 
        file.type === 'application/json' || 
        file.type === 'text/csv' || 
        file.name.endsWith('.json') || 
        file.name.endsWith('.csv')
      );
      
      if (validFiles.length !== fileArray.length) {
        toast({
          title: "Invalid file types",
          description: "Only JSON and CSV files are supported.",
          variant: "destructive",
        });
      }
      
      setSelectedFiles(validFiles);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const parseFileContent = async (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          if (file.name.endsWith('.json')) {
            resolve(JSON.parse(content));
          } else if (file.name.endsWith('.csv')) {
            // Simple CSV parser - split by lines and commas
            const lines = content.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            const data = lines.slice(1).map(line => {
              const values = line.split(',').map(v => v.trim());
              const obj: any = {};
              headers.forEach((header, index) => {
                obj[header] = values[index];
              });
              return obj;
            }).filter(obj => Object.values(obj).some(val => val)); // Remove empty rows
            resolve({ items: data });
          }
        } catch (error) {
          reject(new Error(`Failed to parse ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsText(file);
    });
  };

  const getEndpointFromFilename = (filename: string): { endpoint: string; readonly: boolean } | null => {
    const baseName = filename.replace(/\.(json|csv)$/, '');
    
    const endpointMap: { [key: string]: { endpoint: string; readonly: boolean } } = {
      'users': { endpoint: 'https://python-database-production.up.railway.app/api/users/', readonly: true },
      'books': { endpoint: 'https://python-database-production.up.railway.app/api/books/', readonly: false },
      'diseases': { endpoint: 'https://python-database-production.up.railway.app/api/diseases/', readonly: false },
      'drugs': { endpoint: 'https://python-database-production.up.railway.app/api/drugs/', readonly: false },
      'dictionary': { endpoint: 'https://python-database-production.up.railway.app/api/dictionary/', readonly: false },
      'staff': { endpoint: 'https://python-database-production.up.railway.app/api/staff/', readonly: false },
      'normal-ranges': { endpoint: 'https://python-database-production.up.railway.app/api/normal-ranges/', readonly: false },
      'tutorial-videos': { endpoint: 'https://python-database-production.up.railway.app/api/tutorial-videos/', readonly: false },
      'instruments': { endpoint: 'https://python-database-production.up.railway.app/api/instruments/', readonly: false },
      'notes': { endpoint: 'https://python-database-production.up.railway.app/api/notes/', readonly: false },
      'urine-slides': { endpoint: 'https://python-database-production.up.railway.app/api/urine-slides/', readonly: false },
      'stool-slides': { endpoint: 'https://python-database-production.up.railway.app/api/stool-slides/', readonly: false },
      'other-slides': { endpoint: 'https://python-database-production.up.railway.app/api/other-slides/', readonly: false },
      'notifications': { endpoint: 'https://python-database-production.up.railway.app/api/notifications/', readonly: false },
      'app-links': { endpoint: 'https://python-database-production.up.railway.app/api/app-links/', readonly: false },
      'about': { endpoint: 'https://python-database-production.up.railway.app/api/about/', readonly: false }
    };

    return endpointMap[baseName] || null;
  };

  const importFile = async (file: File): Promise<ImportResult> => {
    try {
      const data = await parseFileContent(file);
      const endpointInfo = getEndpointFromFilename(file.name);
      
      if (!endpointInfo) {
        return {
          file: file.name,
          status: 'error',
          message: 'Unknown file type - cannot determine API endpoint'
        };
      }

      if (endpointInfo.readonly) {
        return {
          file: file.name,
          status: 'error',
          message: 'This endpoint is read-only and does not support importing data'
        };
      }

      // Get authentication token
      const authResponse = await fetch('/api/vet-auth');
      const authData = await authResponse.json();

      // Import data items
      const items = Array.isArray(data) ? data : (data.items || []);
      let successCount = 0;
      let errorCount = 0;

      for (const item of items) {
        try {
          const response = await fetch(endpointInfo.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authData.token}`
            },
            body: JSON.stringify(item)
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
            const errorText = await response.text();
            console.warn(`Failed to import item from ${file.name}:`, errorText);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error importing item from ${file.name}:`, error);
        }
      }

      return {
        file: file.name,
        status: errorCount === 0 ? 'success' : (successCount > 0 ? 'success' : 'error'),
        message: errorCount === 0 
          ? `Successfully imported ${successCount} items`
          : `Imported ${successCount} items, ${errorCount} failed`,
        count: successCount
      };

    } catch (error) {
      return {
        file: file.name,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  };

  const handleImport = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to import.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportResults([]);

    try {
      const results: ImportResult[] = [];
      
      for (const file of selectedFiles) {
        // Update status to processing
        setImportResults(prev => [...prev, {
          file: file.name,
          status: 'processing',
          message: 'Processing...'
        }]);

        const result = await importFile(file);
        
        // Update with final result
        setImportResults(prev => 
          prev.map(r => r.file === file.name ? result : r)
        );
        
        results.push(result);
      }

      const successCount = results.filter(r => r.status === 'success').length;
      const totalItems = results.reduce((sum, r) => sum + (r.count || 0), 0);

      toast({
        title: "Import completed",
        description: `Successfully processed ${successCount}/${results.length} files (${totalItems} total items)`,
        variant: successCount === results.length ? "default" : "destructive",
      });

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: "An error occurred while importing data.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setImportResults([]);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Import Data</h2>
        <p className="text-muted-foreground">Import data from JSON or CSV files back into your platform</p>
      </div>

      {/* File Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Select Files</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="file"
              multiple
              accept=".json,.csv"
              onChange={handleFileSelect}
              className="cursor-pointer"
              data-testid="input-file-select"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Supported formats: JSON, CSV. Files should be named according to data type (e.g., users.json, dictionary.csv)
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Selected Files ({selectedFiles.length})</h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearAll}
                  data-testid="button-clear-all"
                >
                  Clear All
                </Button>
              </div>
              <div className="grid gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      data-testid={`button-remove-file-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={handleImport} 
            disabled={selectedFiles.length === 0 || isImporting}
            className="w-full"
            data-testid="button-import"
          >
            {isImporting ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Importing...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Import Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import Results */}
      {importResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Import Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {importResults.map((result, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 border rounded"
                  data-testid={`result-${index}`}
                >
                  <div className="flex items-center space-x-3">
                    {result.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {result.status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                    {result.status === 'processing' && <LoadingSpinner className="h-5 w-5" />}
                    <div>
                      <p className="font-medium">{result.file}</p>
                      <p className="text-sm text-muted-foreground">{result.message}</p>
                    </div>
                  </div>
                  {result.count && (
                    <span className="text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                      {result.count} items
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Import Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>File Naming:</strong> Name files according to data type (dictionary.json, books.csv, etc.)</p>
            <p><strong>Supported Types:</strong> books, diseases, drugs, dictionary, staff, normal-ranges, tutorial-videos, instruments, notes, urine-slides, stool-slides, other-slides, notifications, app-links, about</p>
            <p><strong>Read-Only Types:</strong> users (can export but not import)</p>
            <p><strong>JSON Format:</strong> Should contain an array of objects or an object with an "items" property</p>
            <p><strong>CSV Format:</strong> First row should contain column headers</p>
            <p><strong>Large Files:</strong> Import is processed item by item, so large files may take time</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}