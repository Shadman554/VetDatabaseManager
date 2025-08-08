import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileText, Database, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ExportItem {
  id: string;
  label: string;
  endpoint: string;
  structure: any;
  apiCall: () => Promise<any>;
}

export default function ExportData() {
  const { toast } = useToast();
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  const exportItems: ExportItem[] = [
    {
      id: "users",
      label: "Users",
      endpoint: "/api/auth/me",
      structure: {
        username: "string",
        email: "user@example.com",
        id: "string",
        is_active: true,
        is_admin: true,
        total_points: 0,
        today_points: 0,
        photo_url: "string",
        created_at: "2025-08-08T12:24:08.182Z",
        last_updated: "2025-08-08T12:24:08.182Z",
        google_id: "string"
      },
      apiCall: () => api.getCurrentUser()
    },
    {
      id: "books",
      label: "Books",
      endpoint: "/api/books/",
      structure: {
        title: "string",
        description: "string",
        category: "string",
        cover_url: "string",
        download_url: "string",
        id: "string",
        added_at: "2025-08-08T12:26:10.116Z"
      },
      apiCall: async () => {
        try {
          const authResponse = await fetch('/api/vet-auth');
          const authData = await authResponse.json();
          
          const response = await fetch(`https://python-database-production.up.railway.app/api/books/?page=1&size=10000`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authData.token}`
            }
          });
          
          return await response.json();
        } catch (error) {
          console.error('Books fetch error:', error);
          return { items: [], total: 0 };
        }
      }
    },
    {
      id: "diseases",
      label: "Diseases",
      endpoint: "/api/diseases/",
      structure: {
        name: "string",
        kurdish: "string",
        symptoms: "string",
        cause: "string",
        control: "string"
      },
      apiCall: async () => {
        try {
          const authResponse = await fetch('/api/vet-auth');
          const authData = await authResponse.json();
          
          const response = await fetch(`https://python-database-production.up.railway.app/api/diseases/?page=1&size=10000`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authData.token}`
            }
          });
          
          return await response.json();
        } catch (error) {
          console.error('Diseases fetch error:', error);
          return { items: [], total: 0 };
        }
      }
    },
    {
      id: "drugs",
      label: "Drugs",
      endpoint: "/api/drugs/",
      structure: {
        name: "string",
        usage: "string",
        side_effect: "string",
        other_info: "string",
        drug_class: "string"
      },
      apiCall: async () => {
        try {
          const authResponse = await fetch('/api/vet-auth');
          const authData = await authResponse.json();
          
          const response = await fetch(`https://python-database-production.up.railway.app/api/drugs/?page=1&size=10000`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authData.token}`
            }
          });
          
          return await response.json();
        } catch (error) {
          console.error('Drugs fetch error:', error);
          return { items: [], total: 0 };
        }
      }
    },
    {
      id: "dictionary",
      label: "Dictionary Words",
      endpoint: "/api/dictionary/",
      structure: {
        name: "string",
        kurdish: "string",
        arabic: "string",
        description: "string"
      },
      apiCall: async () => {
        // Fetch ALL dictionary data using a large size parameter
        try {
          const authResponse = await fetch('/api/vet-auth');
          const authData = await authResponse.json();
          
          const response = await fetch(`https://python-database-production.up.railway.app/api/dictionary/?page=1&size=10000`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authData.token}`
            }
          });
          
          if (!response.ok) {
            console.error('Dictionary API error:', response.status);
            return { items: [], total: 0 };
          }
          
          const data = await response.json();
          console.log('Dictionary items fetched:', data.items?.length || 0);
          
          return data;
        } catch (error) {
          console.error('Dictionary fetch error:', error);
          return { items: [], total: 0 };
        }
      }
    },
    {
      id: "notifications",
      label: "Notifications",
      endpoint: "/api/notifications/",
      structure: {
        title: "string",
        body: "string",
        image_url: "string",
        type: "string"
      },
      apiCall: () => fetch('/api/notifications/?size=10000').then(res => res.json())
    },
    {
      id: "normal_ranges",
      label: "Normal Ranges",
      endpoint: "/api/normal-ranges/",
      structure: {
        name: "string",
        species: "string",
        category: "string",
        unit: "string",
        min_value: "string",
        max_value: "string"
      },
      apiCall: () => api.normalRanges.getAll({ size: 10000 })
    },
    {
      id: "instruments",
      label: "Instruments",
      endpoint: "/api/instruments/",
      structure: {
        name: "string",
        description: "string",
        image_url: "string"
      },
      apiCall: () => api.instruments.getAll({ size: 10000 })
    },
    {
      id: "notes",
      label: "Notes",
      endpoint: "/api/notes/",
      structure: {
        name: "string",
        description: "string",
        image_url: "string"
      },
      apiCall: () => api.notes.getAll({ size: 10000 })
    },
    {
      id: "urine_slides",
      label: "Urine Slides",
      endpoint: "/api/urine-slides/",
      structure: {
        name: "string",
        species: "string",
        image_url: "string"
      },
      apiCall: () => api.urineSlides.getAll({ size: 10000 })
    },
    {
      id: "stool_slides",
      label: "Stool Slides",
      endpoint: "/api/stool-slides/",
      structure: {
        name: "string",
        species: "string",
        image_url: "string"
      },
      apiCall: () => api.stoolSlides.getAll({ size: 10000 })
    },
    {
      id: "other_slides",
      label: "Other Slides",
      endpoint: "/api/other-slides/",
      structure: {
        name: "string",
        species: "string",
        image_url: "string"
      },
      apiCall: () => api.otherSlides.getAll({ size: 10000 })
    }
  ];

  const handleTableSelection = (tableId: string, checked: boolean) => {
    if (checked) {
      setSelectedTables(prev => [...prev, tableId]);
    } else {
      setSelectedTables(prev => prev.filter(id => id !== tableId));
    }
  };

  const selectAll = () => {
    setSelectedTables(exportItems.map(item => item.id));
  };

  const selectNone = () => {
    setSelectedTables([]);
  };

  const convertToCSV = (data: any) => {
    if (!data) return '';
    
    // Handle both array and object with items property
    const items = Array.isArray(data) ? data : (data.items || []);
    if (!Array.isArray(items) || items.length === 0) return '';
    
    const headers = Object.keys(items[0]);
    const csvContent = [
      headers.join(','),
      ...items.map(item => 
        headers.map(header => {
          const value = item[header];
          // Escape CSV values that contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (selectedTables.length === 0) {
      toast({
        title: "No tables selected",
        description: "Please select at least one table to export.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    
    try {
      for (const tableId of selectedTables) {
        const item = exportItems.find(i => i.id === tableId);
        if (item) {
          try {
            const data = await item.apiCall();
            
            if (exportFormat === 'json') {
              // Create separate JSON file for each table with full data
              const jsonContent = JSON.stringify(data, null, 2);
              downloadFile(jsonContent, `${tableId}.json`, 'application/json');
            } else {
              // Create separate CSV file for each table with full data
              const csvContent = convertToCSV(data);
              if (csvContent) {
                downloadFile(csvContent, `${tableId}.csv`, 'text/csv');
              }
            }
          } catch (error) {
            console.error(`Failed to fetch ${tableId}:`, error);
            toast({
              title: `Export failed for ${tableId}`,
              description: `Failed to fetch data: ${error}`,
              variant: "destructive",
            });
          }
        }
      }

      toast({
        title: "Export completed",
        description: `Successfully exported ${selectedTables.length} table(s) as separate ${exportFormat.toUpperCase()} files.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "An error occurred while exporting data.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Export Data</h2>
        <p className="text-muted-foreground">Export your platform data in JSON or CSV format</p>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Export Options</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Export Format</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={exportFormat === 'json'}
                  onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                  className="text-primary"
                />
                <span>JSON (Separate files)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                  className="text-primary"
                />
                <span>CSV (Separate files)</span>
              </label>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={selectAll} size="sm">
              Select All
            </Button>
            <Button variant="outline" onClick={selectNone} size="sm">
              Select None
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Select Tables to Export</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exportItems.map((item) => (
              <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={item.id}
                  checked={selectedTables.includes(item.id)}
                  onCheckedChange={(checked) => handleTableSelection(item.id, checked as boolean)}
                />
                <div className="flex-1 min-w-0">
                  <label htmlFor={item.id} className="font-medium text-sm cursor-pointer">
                    {item.label}
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.endpoint}
                  </p>
                  <div className="mt-2">
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View structure
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                        {JSON.stringify(item.structure, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {selectedTables.length > 0 
                  ? `${selectedTables.length} table(s) selected`
                  : "No tables selected"
                }
              </span>
            </div>
            <Button 
              onClick={handleExport} 
              disabled={isExporting || selectedTables.length === 0}
              className="flex items-center space-x-2"
            >
              {isExporting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>{isExporting ? 'Exporting...' : 'Export Data'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}