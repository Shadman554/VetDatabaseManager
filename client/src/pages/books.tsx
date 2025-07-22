import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { bookSchema, type Book } from "@shared/schema";
import { api } from "@/lib/api";
import { Edit2, Trash2, ExternalLink, Plus, Upload, Download } from "lucide-react";
import Papa from 'papaparse';
import SearchFilterSort from "@/components/ui/search-filter-sort";

export default function Books() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  // Search, filter, and sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  
  // Bulk import state
  const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [bulkResults, setBulkResults] = useState<{success: number, errors: string[], data?: any[]}>({success: 0, errors: []});
  
  const form = useForm({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      cover_url: "",
      download_url: "",
    },
  });

  const editForm = useForm({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      cover_url: "",
      download_url: "",
    },
  });

  // Fetch all books
  const { data: booksResponse, isLoading, error } = useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      try {
        const response = await api.books.getAll();
        console.log('Books API response:', response);
        return response;
      } catch (err) {
        console.error('Books API error:', err);
        throw err;
      }
    },
  });

  // Handle different response formats from the API - ensure we always have an array
  let allBooks = [];
  if (booksResponse) {
    if (Array.isArray(booksResponse)) {
      allBooks = booksResponse;
    } else if (booksResponse.items && Array.isArray(booksResponse.items)) {
      allBooks = booksResponse.items;
    } else if (booksResponse.books && Array.isArray(booksResponse.books)) {
      allBooks = booksResponse.books;
    } else if (booksResponse.data && Array.isArray(booksResponse.data)) {
      allBooks = booksResponse.data;
    } else {
      console.warn('Unexpected books response format:', booksResponse);
      allBooks = [];
    }
  }

  // Get unique categories for filtering
  const categories = useMemo(() => {
    const cats = Array.from(new Set(allBooks.map((book: any) => book.category).filter(Boolean))) as string[];
    return cats.sort();
  }, [allBooks]);

  // Filter, search, and sort books
  const filteredAndSortedBooks = useMemo(() => {
    let filtered = [...allBooks];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(book =>
        book.title?.toLowerCase().includes(search) ||
        book.description?.toLowerCase().includes(search) ||
        book.category?.toLowerCase().includes(search)
      );
    }

    // Apply category filter
    if (activeFilters.category) {
      filtered = filtered.filter(book => book.category === activeFilters.category);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = '';
      let bValue = '';

      switch (sortBy) {
        case 'title':
          aValue = a.title || '';
          bValue = b.title || '';
          break;
        case 'category':
          aValue = a.category || '';
          bValue = b.category || '';
          break;
        case 'added_at':
          aValue = a.added_at || '';
          bValue = b.added_at || '';
          break;
        default:
          aValue = a.title || '';
          bValue = b.title || '';
      }

      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [allBooks, searchTerm, activeFilters, sortBy, sortDirection]);

  const books = filteredAndSortedBooks;

  const createBookMutation = useMutation({
    mutationFn: api.books.create,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Book has been added successfully",
      });
      form.reset();
      setShowAddDialog(false);
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add book: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: ({ title, data }: { title: string; data: Book }) => api.books.update(title, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Book has been updated successfully",
      });
      setShowEditDialog(false);
      setEditingBook(null);
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update book: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: api.books.delete,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Book has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete book: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createBookMutation.mutate(data);
  };

  const onEditSubmit = (data: any) => {
    if (editingBook) {
      updateBookMutation.mutate({ title: editingBook.title, data });
    }
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    editForm.reset({
      title: book.title,
      description: book.description || "",
      category: book.category || "",
      cover_url: book.cover_url || "",
      download_url: book.download_url || "",
    });
    setShowEditDialog(true);
  };

  const handleDelete = (title: string) => {
    deleteBookMutation.mutate(title);
  };

  // Bulk import handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      
      const allowedTypes = ['.csv', '.xlsx', '.xls'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        toast({
          title: "Error",
          description: "Only CSV, XLSX, and XLS files are supported",
          variant: "destructive",
        });
        return;
      }
      
      setBulkImportFile(file);
      setBulkResults({success: 0, errors: []});
    }
  };

  const processBulkImport = async () => {
    if (!bulkImportFile) return;
    
    setIsProcessingBulk(true);
    setBulkResults({success: 0, errors: []});
    
    try {
      const text = await bulkImportFile.text();
      
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: any) => {
          const errors: string[] = [];
          let successCount = 0;
          
          // Validate required columns
          const requiredColumns = ['title', 'description', 'category'];
          const headers = Object.keys(results.data[0] || {});
          const missingColumns = requiredColumns.filter(col => !headers.includes(col));
          
          if (missingColumns.length > 0) {
            toast({
              title: "Invalid CSV Format",
              description: `Missing required columns: ${missingColumns.join(', ')}`,
              variant: "destructive",
            });
            setIsProcessingBulk(false);
            return;
          }
          
          // Process each row
          for (let i = 0; i < results.data.length; i++) {
            const row = results.data[i];
            
            try {
              // Validate required fields
              if (!row.title?.trim()) {
                errors.push(`Row ${i + 1}: Title is required`);
                continue;
              }
              
              if (!row.description?.trim()) {
                errors.push(`Row ${i + 1}: Description is required`);
                continue;
              }
              
              if (!row.category?.trim()) {
                errors.push(`Row ${i + 1}: Category is required`);
                continue;
              }
              
              // Create book data
              const bookData = {
                title: row.title.trim(),
                description: row.description.trim(),
                category: row.category.trim(),
                cover_url: row.cover_url?.trim() || "",
                download_url: row.download_url?.trim() || "",
              };
              
              // Validate with schema
              const validatedData = bookSchema.parse(bookData);
              
              // Create the book
              await api.books.create(validatedData);
              successCount++;
              
            } catch (error: any) {
              errors.push(`Row ${i + 1}: ${error.message || 'Failed to create book'}`);
            }
          }
          
          setBulkResults({success: successCount, errors, data: results.data});
          
          if (successCount > 0) {
            queryClient.invalidateQueries({ queryKey: ['books'] });
            toast({
              title: "Bulk Import Complete",
              description: `Successfully imported ${successCount} books${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
            });
          } else if (errors.length > 0) {
            toast({
              title: "Import Failed",
              description: `No books were imported. Check the error details below.`,
              variant: "destructive",
            });
          }
        },
        error: (error: any) => {
          toast({
            title: "File Processing Error",
            description: `Failed to parse file: ${error.message}`,
            variant: "destructive",
          });
        }
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to process file: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      {
        title: "Veterinary Anatomy Textbook",
        description: "Comprehensive guide to animal anatomy for veterinary students",
        category: "anatomy",
        cover_url: "https://example.com/cover1.jpg",
        download_url: "https://example.com/book1.pdf"
      },
      {
        title: "Small Animal Surgery",
        description: "Advanced surgical techniques for small animals",
        category: "surgery",
        cover_url: "https://example.com/cover2.jpg",
        download_url: "https://example.com/book2.pdf"
      }
    ];
    
    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'books_sample.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Books Management</h2>
          <p className="text-muted-foreground">Manage educational books for the platform</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add New Book
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-lg sm:text-xl">Add New Book</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter book title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="surgery">Surgery</SelectItem>
                            <SelectItem value="medicine">Internal Medicine</SelectItem>
                            <SelectItem value="anatomy">Anatomy</SelectItem>
                            <SelectItem value="pharmacology">Pharmacology</SelectItem>
                            <SelectItem value="pathology">Pathology</SelectItem>
                            <SelectItem value="radiology">Radiology</SelectItem>
                          </SelectContent>
                        </Select>
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter book description"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <FormField
                    control={form.control}
                    name="cover_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover Image URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/cover.jpg"
                            type="url"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="download_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Download URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/book.pdf"
                            type="url"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddDialog(false)}
                    className="w-full sm:w-auto order-2 sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createBookMutation.isPending}
                    className="w-full sm:w-auto order-1 sm:order-2"
                  >
                    {createBookMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Adding...
                      </>
                    ) : (
                      "Add Book"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">All Books</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Books Library</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search, Filter, and Sort Controls */}
              <SearchFilterSort
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                sortOptions={[
                  { value: "title", label: "Title", key: "title" },
                  { value: "category", label: "Category", key: "category" },
                  { value: "added_at", label: "Date Added", key: "added_at" },
                ]}
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSortChange={(key, direction) => {
                  setSortBy(key);
                  setSortDirection(direction);
                }}
                filterOptions={[
                  {
                    key: "category",
                    label: "Category",
                    options: categories.map((cat: string) => ({ value: cat, label: cat })),
                  },
                ]}
                activeFilters={activeFilters}
                onFilterChange={(key, value) => {
                  setActiveFilters(prev => ({ ...prev, [key]: value }));
                }}
                onClearFilters={() => setActiveFilters({})}
                placeholder="Search books by title, description, or category..."
                totalItems={allBooks.length}
                filteredItems={books.length}
              />
              
              <div className="mt-6">
                {isLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <div className="text-red-500 mb-2">Failed to load books</div>
                  <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['books'] })}>
                    Retry
                  </Button>
                </div>
              ) : books.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No books yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start by adding your first educational book
                  </p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Book
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {books.map((book: Book, index: number) => (
                    <Card key={book.title || index} className="relative">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-semibold text-lg line-clamp-2">{book.title}</h3>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(book)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Book</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{book.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(book.title)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        {book.category && (
                          <Badge variant="secondary" className="mb-3">
                            {book.category}
                          </Badge>
                        )}
                        {book.description && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                            {book.description}
                          </p>
                        )}
                        <div className="flex space-x-2">
                          {book.download_url && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={book.download_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Download
                              </a>
                            </Button>
                          )}
                          {book.cover_url && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={book.cover_url} target="_blank" rel="noopener noreferrer">
                                View Cover
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Import Books</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* File Upload Section */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Upload CSV File</h3>
                      <p className="text-sm text-muted-foreground">Import multiple books from a CSV file</p>
                    </div>
                    <Button variant="outline" onClick={downloadSampleCSV}>
                      <Download className="w-4 h-4 mr-2" />
                      Download Sample CSV
                    </Button>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label htmlFor="bulk-file-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Choose a CSV file or drag and drop
                          </span>
                          <span className="mt-1 block text-xs text-gray-500">
                            CSV, XLSX, XLS up to 10MB
                          </span>
                        </label>
                        <input
                          id="bulk-file-upload"
                          name="bulk-file-upload"
                          type="file"
                          className="sr-only"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileSelect}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {bulkImportFile && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="text-blue-400 mr-3">📄</div>
                          <div>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              {bulkImportFile.name}
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              {(bulkImportFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={processBulkImport}
                            disabled={isProcessingBulk}
                          >
                            {isProcessingBulk ? (
                              <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Import Books
                              </>
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setBulkImportFile(null)}
                            disabled={isProcessingBulk}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Results Section */}
                {(bulkResults.success > 0 || bulkResults.errors.length > 0) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Import Results</h3>
                    
                    {bulkResults.success > 0 && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
                        <div className="flex">
                          <div className="text-green-400 mr-3">✅</div>
                          <div>
                            <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                              Successfully Imported
                            </h4>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              {bulkResults.success} books were imported successfully
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {bulkResults.errors.length > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                        <div className="flex">
                          <div className="text-red-400 mr-3">❌</div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                              Errors ({bulkResults.errors.length})
                            </h4>
                            <div className="mt-2 max-h-40 overflow-y-auto">
                              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                                {bulkResults.errors.map((error, index) => (
                                  <li key={index}>• {error}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Format Guidelines */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-4">
                  <div className="flex">
                    <div className="text-blue-400 mr-3">ℹ️</div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-2">CSV Format Guidelines:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Required columns:</strong> title, description, category</li>
                        <li><strong>Optional columns:</strong> cover_url, download_url</li>
                        <li><strong>Categories:</strong> surgery, medicine, anatomy, pharmacology, pathology, radiology</li>
                        <li><strong>Maximum file size:</strong> 10MB</li>
                        <li><strong>Supported formats:</strong> CSV, XLSX, XLS</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Book</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter book title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="surgery">Surgery</SelectItem>
                          <SelectItem value="medicine">Internal Medicine</SelectItem>
                          <SelectItem value="anatomy">Anatomy</SelectItem>
                          <SelectItem value="pharmacology">Pharmacology</SelectItem>
                          <SelectItem value="pathology">Pathology</SelectItem>
                          <SelectItem value="radiology">Radiology</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter book description"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={editForm.control}
                  name="cover_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Image URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/cover.jpg"
                          type="url"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="download_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Download URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/book.pdf"
                          type="url"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateBookMutation.isPending}>
                  {updateBookMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Updating...
                    </>
                  ) : (
                    "Update Book"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
