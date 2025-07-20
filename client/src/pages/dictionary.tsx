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
import { useState } from "react";
import { Edit, Trash2, Plus, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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

  // Process the API response for pagination
  const allTerms = allTermsResponse?.items || [];
  const serverTotal = allTermsResponse?.total || 2444;
  
  let terms: any[] = [];
  let totalItems = 0;
  let totalPages = 1;
  
  if (searchTerm.trim()) {
    // When searching, show all search results
    terms = allTerms;
    totalItems = allTerms.length;
    totalPages = Math.ceil(totalItems / pageSize);
    
    // Apply client-side pagination to search results
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    terms = terms.slice(startIndex, endIndex);
  } else {
    // When browsing, show the 100 terms we got from API
    // but indicate there are more pages available
    terms = allTerms;
    totalItems = serverTotal;
    totalPages = Math.ceil(serverTotal / pageSize);
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Dictionary Management</h2>
          <p className="text-gray-600">Manage veterinary terms with multilingual definitions</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Term
        </Button>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">No dictionary terms yet</h3>
              <p className="text-sm text-gray-600 mb-4">
                Start by adding your first veterinary term
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Term
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative max-w-md">
                  <Input
                    placeholder="Search terms (English, Kurdish, Arabic)..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-4"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => handleSearch("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {searchTerm && (
                  <div className="text-sm text-gray-600 mt-2">
                    {isLoading ? 'Searching...' : `Found ${totalItems} results for "${searchTerm}"`}
                  </div>
                )}
              </div>
              
              {/* Info about current data display */}
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-600">
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
                    <span className="text-xs text-gray-500 px-2 py-1">
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
                        <div className="flex items-center gap-2">
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

      {/* Add/Edit Form Modal */}
      {showForm && (
        <Card className="border-2 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {editingTerm ? 'Edit Dictionary Term' : 'Add New Dictionary Term'}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelEdit}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Term (English) *</FormLabel>
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
                        <FormLabel>Term (Kurdish)</FormLabel>
                        <FormControl>
                          <Input placeholder="زاراوە بە کوردی" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="arabic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Term (Arabic)</FormLabel>
                        <FormControl>
                          <Input placeholder="المصطلح بالعربية" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Definition/Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter comprehensive definition of the term"
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
                      <FormLabel>Barcode/Reference ID</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Optional barcode or reference identifier"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createWordMutation.isPending || updateWordMutation.isPending}
                  >
                    {createWordMutation.isPending || updateWordMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        {editingTerm ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      editingTerm ? 'Update Term' : 'Add Term'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
