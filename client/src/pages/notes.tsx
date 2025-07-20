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
import { Edit, Trash2, Plus, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import SearchFilterSort from "@/components/ui/search-filter-sort";

export default function Notes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  
  // Search, filter, and sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  
  const form = useForm({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      name: "",
      content: "",
      category: "",
    },
  });

  // Fetch notes
  const { data: notesResponse, isLoading, error } = useQuery({
    queryKey: ['notes'],
    queryFn: api.notes.getAll,
  });

  let allNotes: any[] = [];
  if (notesResponse) {
    allNotes = Array.isArray(notesResponse) ? notesResponse : notesResponse.items || [];
  }

  // Get unique categories for filtering
  const categories = useMemo(() => {
    const cats = Array.from(new Set(allNotes.map((note: any) => note.category).filter(Boolean))) as string[];
    return cats.sort();
  }, [allNotes]);

  // Filter, search, and sort notes
  const filteredAndSortedNotes = useMemo(() => {
    let filtered = [...allNotes];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((note: any) =>
        note.name?.toLowerCase().includes(search) ||
        note.content?.toLowerCase().includes(search) ||
        note.category?.toLowerCase().includes(search)
      );
    }

    // Apply category filter
    if (activeFilters.category) {
      filtered = filtered.filter((note: any) => note.category === activeFilters.category);
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
        case 'category':
          aValue = a.category || '';
          bValue = b.category || '';
          break;
        default:
          aValue = a.name || '';
          bValue = b.name || '';
      }

      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [allNotes, searchTerm, activeFilters, sortBy, sortDirection]);

  const notes = filteredAndSortedNotes;

  const createNoteMutation = useMutation({
    mutationFn: api.notes.create,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Note has been added successfully",
      });
      form.reset();
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add note: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ name, data }: { name: string; data: any }) => api.notes.update(name, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Note has been updated successfully",
      });
      form.reset();
      setEditingNote(null);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update note: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: api.notes.delete,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Note has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete note: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (editingNote) {
      updateNoteMutation.mutate({ name: editingNote.name, data });
    } else {
      createNoteMutation.mutate(data);
    }
  };

  const handleEdit = (note: any) => {
    setEditingNote(note);
    form.reset({
      name: note.name || "",
      content: note.content || "",
      category: note.category || "",
    });
    setShowForm(true);
  };

  const handleDelete = (name: string) => {
    deleteNoteMutation.mutate(name);
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setShowForm(false);
    form.reset();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Notes Management</h2>
          <p className="text-muted-foreground">Manage educational notes and study materials</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Note
        </Button>
      </div>

      {/* Notes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Notes Database</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search, Filter, and Sort Controls */}
          <SearchFilterSort
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortOptions={[
              { value: "name", label: "Title", key: "name" },
              { value: "category", label: "Category", key: "category" },
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
            placeholder="Search notes by title, content, or category..."
            totalItems={allNotes.length}
            filteredItems={notes.length}
          />
          
          <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">Failed to load notes</div>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['notes'] })}>
                Retry
              </Button>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-foreground mb-2">No notes yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start by adding your first educational note
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Note
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notes.map((note: any, index: number) => (
                  <TableRow key={note.name || note.id || index}>
                    <TableCell className="font-medium">{note.name}</TableCell>
                    <TableCell>{note.category || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {note.content ? note.content.substring(0, 100) + '...' : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(note)}
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
                              <AlertDialogTitle>Delete Note</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{note.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(note.name)}
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
          )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{editingNote ? 'Edit Note' : 'Add New Note'}</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter note title" {...field} />
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
                      <FormControl>
                        <Input placeholder="e.g., Lecture Notes, Clinical Cases, Study Guide" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter the note content here..."
                        rows={10}
                        className="min-h-[250px]"
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
                    disabled={createNoteMutation.isPending || updateNoteMutation.isPending}
                  >
                    {createNoteMutation.isPending || updateNoteMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        {editingNote ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      editingNote ? 'Update Note' : 'Add Note'
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
