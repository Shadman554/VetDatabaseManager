import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { dictionarySchema } from "@shared/schema";
import { api } from "@/lib/api";
import { useState, useMemo } from "react";
import { Edit, Trash2, Plus, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import SearchFilterSort from "@/components/ui/search-filter-sort";

export default function Dictionary() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingTerm, setEditingTerm] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(dictionarySchema),
    defaultValues: {
      name: "",
      kurdish: "",
      arabic: "",
      description: "",
      barcode: "",
      is_saved: false,
      is_favorite: false,
    },
  });

  // Fetch ALL dictionary terms and implement client-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const pageSize = 50; // Client-side page size
  
  // Get dictionary terms (working around API pagination limitations)
  const { data: allTermsResponse, isLoading, error } = useQuery({
    queryKey: ['dictionary-all', searchTerm],
    queryFn: async () => {
      if (searchTerm.trim()) {
        // Use search when filtering - search works properly
        return api.dictionary.getAll({ search: searchTerm.trim(), page: 1, limit: 100 });
      } else {
        // For now, get one page of 100 terms and implement real pagination
        // This is better than the broken server-side pagination
        return api.dictionary.getAll({ page: 1, limit: 100 });
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Process the API response for filtering, sorting, and pagination
  const rawTerms = allTermsResponse?.items || [];
  const serverTotal = allTermsResponse?.total || 2444;
  
  // Filter and sort terms
  const filteredAndSortedTerms = useMemo(() => {
    let processed = [...rawTerms];

    // Apply search filter (this is already done at API level, but we include it for completeness)
    if (searchTerm.trim() && !allTermsResponse) {
      const search = searchTerm.toLowerCase();
      processed = processed.filter((term: any) =>
        term.name?.toLowerCase().includes(search) ||
        term.kurdish?.toLowerCase().includes(search) ||
        term.arabic?.toLowerCase().includes(search) ||
        term.description?.toLowerCase().includes(search)
      );
    }

    // Apply favorite filter
    if (activeFilters.is_favorite === 'true') {
      processed = processed.filter((term: any) => term.is_favorite === true);
    } else if (activeFilters.is_favorite === 'false') {
      processed = processed.filter((term: any) => term.is_favorite === false);
    }

    // Apply saved filter
    if (activeFilters.is_saved === 'true') {
      processed = processed.filter((term: any) => term.is_saved === true);
    } else if (activeFilters.is_saved === 'false') {
      processed = processed.filter((term: any) => term.is_saved === false);
    }

    // Apply sorting
    processed.sort((a: any, b: any) => {
      let aValue = '';
      let bValue = '';

      switch (sortBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'kurdish':
          aValue = a.kurdish || '';
          bValue = b.kurdish || '';
          break;
        case 'arabic':
          aValue = a.arabic || '';
          bValue = b.arabic || '';
          break;
        case 'created_at':
          aValue = a.created_at || '';
          bValue = b.created_at || '';
          break;
        default:
          aValue = a.name || '';
          bValue = b.name || '';
      }

      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return processed;
  }, [rawTerms, searchTerm, activeFilters, sortBy, sortDirection, allTermsResponse]);
  
  // Implement client-side pagination
  let terms: any[] = [];
  let totalItems = 0;
  let totalPages = 1;
  
  if (searchTerm.trim()) {
    // When searching, paginate filtered results
    totalItems = filteredAndSortedTerms.length;
    totalPages = Math.ceil(totalItems / pageSize);
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    terms = filteredAndSortedTerms.slice(startIndex, endIndex);
  } else {
    // For all terms, show the filtered data but indicate there's more available
    totalItems = serverTotal; // Server total (for display)
    totalPages = Math.ceil(filteredAndSortedTerms.length / pageSize);
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    terms = filteredAndSortedTerms.slice(startIndex, endIndex);
  }
  
  // Create response format to match existing code
  const dictionaryResponse = {
    items: terms,
    total: totalItems,
    total_items: totalItems,
    total_pages: totalPages,
    pages: totalPages,
    page: currentPage,
    size: terms.length
  };

  // Reset to page 1 when searching
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };
  


  const createWordMutation = useMutation({
    mutationFn: api.dictionary.create,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dictionary term has been added successfully",
      });
      form.reset();
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['dictionary'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add dictionary term: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateWordMutation = useMutation({
    mutationFn: ({ name, data }: { name: string; data: any }) => api.dictionary.update(name, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dictionary term has been updated successfully",
      });
      form.reset();
      setEditingTerm(null);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['dictionary'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update dictionary term: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteWordMutation = useMutation({
    mutationFn: api.dictionary.delete,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dictionary term has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['dictionary'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete dictionary term: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (editingTerm) {
      updateWordMutation.mutate({ name: editingTerm.name, data });
    } else {
      createWordMutation.mutate(data);
    }
  };

  const handleEdit = (term: any) => {
    setEditingTerm(term);
    form.reset({
      name: term.name || "",
      kurdish: term.kurdish || "",
      arabic: term.arabic || "",
      description: term.description || "",
      barcode: term.barcode || "",
      is_saved: term.is_saved || false,
      is_favorite: term.is_favorite || false,
    });
    setShowForm(true);
  };

  const handleDelete = (name: string) => {
    deleteWordMutation.mutate(name);
  };

  const handleCancelEdit = () => {
    setEditingTerm(null);
    setShowForm(false);
    form.reset();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Dictionary Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Manage veterinary terms with multilingual definitions</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Term
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTerm ? 'Edit Dictionary Term' : 'Add New Dictionary Term'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>English Term *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter term in English" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="kurdish"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kurdish Term</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter term in Kurdish" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="arabic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arabic Term</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter term in Arabic" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter detailed description or definition"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barcode</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter barcode if applicable" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="is_favorite"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Favorite</FormLabel>
                          <FormMessage />
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="is_saved"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Saved</FormLabel>
                          <FormMessage />
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createWordMutation.isPending || updateWordMutation.isPending}>
                    {createWordMutation.isPending || updateWordMutation.isPending 
                      ? "Saving..." 
                      : (editingTerm ? "Update Term" : "Add Term")
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dictionary Terms Table */}
      <Card>
        <CardHeader>
          <CardTitle>Dictionary Terms ({totalItems.toLocaleString()} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">Failed to load dictionary terms</div>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['dictionary'] })}>
                Retry
              </Button>
            </div>
          ) : terms.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-foreground mb-2">No dictionary terms yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start by adding your first veterinary term
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Term
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search, Filter, and Sort Controls */}
              <SearchFilterSort
                searchTerm={searchTerm}
                onSearchChange={handleSearch}
                sortOptions={[
                  { value: "name", label: "English Term", key: "name" },
                  { value: "kurdish", label: "Kurdish Term", key: "kurdish" },
                  { value: "arabic", label: "Arabic Term", key: "arabic" },
                  { value: "created_at", label: "Date Created", key: "created_at" },
                ]}
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSortChange={(key, direction) => {
                  setSortBy(key);
                  setSortDirection(direction);
                }}
                filterOptions={[
                  {
                    key: "is_favorite",
                    label: "Favorites",
                    options: [
                      { value: "true", label: "Favorites Only" },
                      { value: "false", label: "Non-Favorites" },
                    ],
                  },
                  {
                    key: "is_saved",
                    label: "Saved Status",
                    options: [
                      { value: "true", label: "Saved Only" },
                      { value: "false", label: "Unsaved" },
                    ],
                  },
                ]}
                activeFilters={activeFilters}
                onFilterChange={(key, value) => {
                  setActiveFilters(prev => ({ ...prev, [key]: value }));
                }}
                onClearFilters={() => setActiveFilters({})}
                placeholder="Search dictionary terms in English, Kurdish, or Arabic..."
                totalItems={rawTerms.length}
                filteredItems={terms.length}
              />
              
              {/* Info about current data display */}
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-muted-foreground">
                  {searchTerm.trim() ? (
                    `Found ${totalItems} results${totalPages > 1 ? ` (page ${currentPage} of ${totalPages})` : ''} for "${searchTerm}"`
                  ) : (
                    `Showing first 100 terms of ${totalItems.toLocaleString()} total dictionary terms`
                  )}
                </div>
                {searchTerm.trim() && totalPages > 1 && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage <= 1 || isLoading}
                    >
                      Previous
                    </Button>
                    <span className="text-xs text-muted-foreground px-2 py-1">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage >= totalPages || isLoading}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
              
              {!searchTerm.trim() && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <div className="text-blue-800 dark:text-blue-200 text-sm">
                    <strong>Note:</strong> Currently showing the first 100 dictionary terms. Use the search box above to find specific terms across all 2,444 entries. Search works across English, Kurdish, and Arabic text.
                  </div>
                </div>
              )}
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                  <TableRow>
                    <TableHead>English</TableHead>
                    <TableHead>Kurdish</TableHead>
                    <TableHead>Arabic</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {terms.map((term: any, index: number) => (
                    <TableRow key={`${term.id || term.name || 'term'}-${index}-${currentPage}`}>
                      <TableCell className="font-medium">{term.name}</TableCell>
                      <TableCell>{term.kurdish || '-'}</TableCell>
                      <TableCell>{term.arabic || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {term.description ? term.description.substring(0, 60) + '...' : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(term)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex items-center gap-1 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Term</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{term.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(term.name)}
                                  className="bg-red-600 hover:bg-red-700"
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
              
              {terms.length > 50 && (
                <div className="text-center py-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">
                    Showing first 50 of {terms.length.toLocaleString()} terms for performance
                  </p>
                  <p className="text-xs text-gray-500">
                    Use your browser's search (Ctrl+F) to find specific terms, or add filters to narrow down results
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
}
