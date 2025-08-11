import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { noteSchema } from "@shared/schema";
import { api } from "@/lib/api";
import { useState, useMemo } from "react";
import { Edit, Trash2, Plus, X, Eye, BookOpen } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SearchFilterSort from "@/components/ui/search-filter-sort";

interface Section {
  title: string;
  content: string;
  image_url?: string;
}

interface TestFormData {
  name: string;
  image_url?: string;
  sections: Section[];
}

export default function OtherTests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingTest, setEditingTest] = useState<any>(null);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  // Search, filter, and sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  
  const [sections, setSections] = useState<Section[]>([
    { title: "", content: "", image_url: "" }
  ]);

  const form = useForm({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      name: "",
      image_url: "",
      description: "",
    },
  });

  // Fetch tests
  const { data: testsResponse, isLoading, error } = useQuery({
    queryKey: ['other-tests'],
    queryFn: async () => {
      try {
        const response = await fetch('https://python-database-production.up.railway.app/api/other-tests/', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch');
        return response.json();
      } catch (err) {
        console.error('Other tests API error:', err);
        throw err;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Handle different API response formats
  let allTests = [];
  if (testsResponse) {
    if (Array.isArray(testsResponse)) {
      allTests = testsResponse;
    } else if (testsResponse.items && Array.isArray(testsResponse.items)) {
      allTests = testsResponse.items;
    } else if (testsResponse.tests && Array.isArray(testsResponse.tests)) {
      allTests = testsResponse.tests;
    } else if (testsResponse.data && Array.isArray(testsResponse.data)) {
      allTests = testsResponse.data;
    } else if (testsResponse.results && Array.isArray(testsResponse.results)) {
      allTests = testsResponse.results;
    }
  }

  // Filter, search, and sort tests
  const filteredAndSortedTests = useMemo(() => {
    let filtered = [...allTests];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((test: any) =>
        test.name?.toLowerCase().includes(search) ||
        test.description?.toLowerCase().includes(search)
      );
    }

    // Apply sorting
    filtered.sort((a: any, b: any) => {
      let aValue = '';
      let bValue = '';

      switch (sortBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        default:
          aValue = a.name || '';
          bValue = b.name || '';
      }

      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [allTests, searchTerm, activeFilters, sortBy, sortDirection]);

  // Create test mutation
  const createTestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('https://python-database-production.up.railway.app/api/other-tests/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create test');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['other-tests'] });
      toast({ title: "Success", description: "Test created successfully" });
      resetForm();
      setShowForm(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to create test", variant: "destructive" });
    },
  });

  // Update test mutation
  const updateTestMutation = useMutation({
    mutationFn: async ({ name, data }: { name: string; data: any }) => {
      const response = await fetch(`https://python-database-production.up.railway.app/api/other-tests/${encodeURIComponent(name)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update test');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['other-tests'] });
      toast({ title: "Success", description: "Test updated successfully" });
      resetForm();
      setShowForm(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to update test", variant: "destructive" });
    },
  });

  // Delete test mutation
  const deleteTestMutation = useMutation({
    mutationFn: async (name: string) => {
      console.log('Making request to:', `https://python-database-production.up.railway.app/api/other-tests/${encodeURIComponent(name)}`, 'with method:', 'DELETE');
      console.log('Request headers:', {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      });
      
      const response = await fetch(`https://python-database-production.up.railway.app/api/other-tests/${encodeURIComponent(name)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete error response:', errorText);
        throw new Error(`Failed to delete test: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      // Some DELETE endpoints might return empty response
      const responseText = await response.text();
      return responseText ? JSON.parse(responseText) : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['other-tests'] });
      toast({ title: "Success", description: "Test deleted successfully" });
    },
    onError: (error: any) => {
      console.error('Delete mutation error:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete test", 
        variant: "destructive" 
      });
    },
  });

  const addSection = () => {
    setSections([...sections, { title: "", content: "", image_url: "" }]);
  };

  const removeSection = (index: number) => {
    if (sections.length > 1) {
      const newSections = sections.filter((_, i) => i !== index);
      setSections(newSections);
    }
  };

  const updateSection = (index: number, field: keyof Section, value: string) => {
    const newSections = [...sections];
    newSections[index][field] = value;
    setSections(newSections);
  };

  const onSubmit = (data: any) => {
    // Convert sections to JSON format for the API - include image_url for each section
    const structuredDescription = {
      sections: sections.filter(section => section.title.trim() || section.content.trim() || section.image_url?.trim()).map(section => ({
        title: section.title,
        content: section.content,
        image_url: section.image_url || ""
      }))
    };

    const testData = {
      ...data,
      description: JSON.stringify(structuredDescription)
    };

    if (editingTest) {
      updateTestMutation.mutate({ name: editingTest.name, data: testData });
    } else {
      createTestMutation.mutate(testData);
    }
  };

  const resetForm = () => {
    form.reset();
    setSections([{ title: "", content: "", image_url: "" }]);
    setEditingTest(null);
  };

  const startEdit = (test: any) => {
    setEditingTest(test);
    form.setValue("name", test.name);
    form.setValue("image_url", test.image_url || "");
    
    // Parse existing description if it's JSON
    try {
      const parsed = JSON.parse(test.description || '{}');
      if (parsed.sections && Array.isArray(parsed.sections)) {
        // Ensure all sections have image_url field for backward compatibility
        const sectionsWithImageUrl = parsed.sections.map((section: any) => ({
          title: section.title || "",
          content: section.content || "",
          image_url: section.image_url || ""
        }));
        setSections(sectionsWithImageUrl.length > 0 ? sectionsWithImageUrl : [{ title: "", content: "", image_url: "" }]);
      } else {
        setSections([{ title: "", content: test.description || "", image_url: "" }]);
      }
    } catch (e) {
      // If not JSON, treat as simple description
      setSections([{ title: "", content: test.description || "", image_url: "" }]);
    }
    
    setShowForm(true);
  };

  const handleViewDetails = (test: any) => {
    setSelectedTest(test);
    setShowDetailDialog(true);
  };

  const renderSections = (description: string) => {
    try {
      const parsed = JSON.parse(description);
      if (parsed.sections && Array.isArray(parsed.sections)) {
        return (
          <div className="space-y-4">
            {parsed.sections.map((section: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 bg-muted/50">
                {section.title && (
                  <h4 className="font-semibold text-sm mb-2 text-foreground">{section.title}</h4>
                )}
                {section.content && (
                  <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">{section.content}</p>
                )}
                {section.image_url && (
                  <div className="mt-2">
                    <img
                      src={section.image_url}
                      alt={section.title || `Section ${index + 1} image`}
                      className="max-w-full h-auto rounded-md border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }
    } catch (e) {
      // Fallback for non-JSON descriptions
    }
    return <p className="text-sm text-muted-foreground whitespace-pre-wrap">{description}</p>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error loading tests</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Failed to load other tests. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Other Tests</h1>
          <p className="text-muted-foreground">Manage other laboratory tests</p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Test
        </Button>
      </div>

      {/* Search and Filter */}
      <SearchFilterSort
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search tests..."
        sortBy={sortBy}
        onSortChange={(field, direction) => {
          setSortBy(field);
          setSortDirection(direction);
        }}
        sortDirection={sortDirection}
        activeFilters={activeFilters}
        onFilterChange={(key, value) => {
          setActiveFilters(prev => ({ ...prev, [key]: value }));
        }}
        onClearFilters={() => setActiveFilters({})}
        sortOptions={[
          { key: "name", value: "name", label: "Name" },
        ]}
        filterOptions={[]}
        totalItems={allTests.length}
        filteredItems={filteredAndSortedTests.length}
      />

      {/* Tests Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Tests ({filteredAndSortedTests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAndSortedTests.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No tests found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "No tests match your search criteria." : "Get started by adding your first test."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Test
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedTests.map((test: any, index: number) => (
                    <TableRow key={`${test.name}-${test.id || index}`}>
                      <TableCell className="font-medium">{test.name}</TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          {test.description ? (
                            <div className="text-sm text-muted-foreground">
                              {(() => {
                                try {
                                  const parsed = JSON.parse(test.description);
                                  if (parsed.sections && Array.isArray(parsed.sections)) {
                                    const firstSection = parsed.sections[0];
                                    return firstSection?.title || firstSection?.content?.substring(0, 100) || "No content";
                                  }
                                } catch (e) {
                                  return test.description.substring(0, 100);
                                }
                                return test.description.substring(0, 100);
                              })()}
                              {test.description.length > 100 && '...'}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">No description</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(test)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(test)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Test</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{test.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteTestMutation.mutate(test.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTest ? "Edit Test" : "Add New Test"}</DialogTitle>
            <DialogDescription>
              {editingTest ? "Update the test information below." : "Fill in the details to create a new test."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter test name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sections */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Sections</h3>
                  <Button type="button" onClick={addSection} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                </div>

                {sections.map((section, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Section {index + 1}</CardTitle>
                        {sections.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSection(index)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Title</label>
                        <Input
                          placeholder="Section title"
                          value={section.title}
                          onChange={(e) => updateSection(index, 'title', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Content</label>
                        <Textarea
                          placeholder="Section content"
                          value={section.content}
                          onChange={(e) => updateSection(index, 'content', e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Image URL</label>
                        <Input
                          placeholder="https://example.com/section-image.jpg"
                          value={section.image_url || ""}
                          onChange={(e) => updateSection(index, 'image_url', e.target.value)}
                        />
                        {section.image_url && (
                          <div className="mt-2">
                            <img
                              src={section.image_url}
                              alt={section.title || `Section ${index + 1} preview`}
                              className="max-w-xs h-auto rounded-md border"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTestMutation.isPending || updateTestMutation.isPending}
                >
                  {(createTestMutation.isPending || updateTestMutation.isPending) && (
                    <LoadingSpinner className="mr-2" size="sm" />
                  )}
                  {editingTest ? "Update" : "Create"} Test
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Detail View Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTest?.name}</DialogTitle>
            {selectedTest?.image_url && (
              <div className="mt-4">
                <img
                  src={selectedTest.image_url}
                  alt={selectedTest.name}
                  className="max-w-full h-auto rounded-lg border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </DialogHeader>
          <div className="mt-4">
            {selectedTest?.description ? renderSections(selectedTest.description) : (
              <p className="text-muted-foreground italic">No description available</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}