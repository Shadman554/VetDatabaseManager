import { useState } from "react";
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
import { Edit2, Trash2, ExternalLink, Plus } from "lucide-react";

export default function Books() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
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
  let books = [];
  if (booksResponse) {
    if (Array.isArray(booksResponse)) {
      books = booksResponse;
    } else if (booksResponse.books && Array.isArray(booksResponse.books)) {
      books = booksResponse.books;
    } else if (booksResponse.data && Array.isArray(booksResponse.data)) {
      books = booksResponse.data;
    } else {
      console.warn('Unexpected books response format:', booksResponse);
      books = [];
    }
  }

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

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Books Management</h2>
          <p className="text-gray-600">Manage educational books for the platform</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add New Book
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Book</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div className="flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createBookMutation.isPending}>
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
              <CardTitle>All Books ({books.length})</CardTitle>
            </CardHeader>
            <CardContent>
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No books yet</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Start by adding your first educational book
                  </p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Book
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
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
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Import Books</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Bulk Import Coming Soon</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload CSV or Excel files to import multiple books at once
                </p>
                <div className="bg-blue-50 rounded-md p-4 text-left">
                  <div className="flex">
                    <div className="text-blue-400 mr-3">ℹ️</div>
                    <div className="text-sm text-blue-700">
                      <p className="font-medium mb-1">CSV Format Guidelines:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Required columns: title, description, category</li>
                        <li>Optional columns: cover_url, download_url</li>
                        <li>Maximum file size: 10MB</li>
                        <li>Supported formats: CSV, XLSX, XLS</li>
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
