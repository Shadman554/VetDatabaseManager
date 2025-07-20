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
import { useState, useMemo, useRef } from "react";
import { Edit, Trash2, Plus, X, Eye, EyeOff, Type, List, Hash, Bold, FileText } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchFilterSort from "@/components/ui/search-filter-sort";

export default function Notes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
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
    setShowPreview(false);
    form.reset();
  };

  // Format text content for display (similar to Flutter app)
  const formatTextContent = (content: string) => {
    if (!content) return '';
    
    // Split by ** to separate headings from regular text
    const parts = content.split('**');
    const elements: JSX.Element[] = [];
    
    parts.forEach((part, index) => {
      const trimmed = part.trim();
      if (!trimmed) return;
      
      // Even indices are regular text, odd indices are headings
      if (index % 2 === 0) {
        // Regular text - process ## for sub-headings and * for bullets
        const lines = trimmed.split('\n');
        lines.forEach((line, lineIndex) => {
          const trimmedLine = line.trim();
          if (!trimmedLine) {
            elements.push(<div key={`${index}-${lineIndex}-space`} className="h-2" />);
            return;
          }
          
          // Sub-heading starting with ##
          if (trimmedLine.startsWith('##')) {
            const subHeading = trimmedLine.replace(/^##\s*/, '');
            elements.push(
              <h3 key={`${index}-${lineIndex}`} className="text-lg font-semibold text-blue-600 dark:text-blue-400 mt-4 mb-2" dir="auto">
                {subHeading}
              </h3>
            );
            return;
          }
          
          // Bullet points starting with * or •
          if (trimmedLine.startsWith('*') || trimmedLine.startsWith('•')) {
            const bulletText = trimmedLine.startsWith('*') 
              ? trimmedLine.replace(/^\*\s*/, '• ')
              : trimmedLine;
            elements.push(
              <div key={`${index}-${lineIndex}`} className="ml-4 mb-1 text-gray-700 dark:text-gray-300" dir="auto">
                {bulletText}
              </div>
            );
            return;
          }
          
          // Regular text
          elements.push(
            <p key={`${index}-${lineIndex}`} className="mb-2 text-gray-800 dark:text-gray-200" dir="auto">
              {trimmedLine}
            </p>
          );
        });
      } else {
        // This is a heading (text between **)
        elements.push(
          <h2 key={`heading-${index}`} className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-6 mb-3" dir="auto">
            {trimmed}
          </h2>
        );
      }
    });
    
    return elements;
  };

  // Insert formatting at cursor position
  const insertFormatting = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = form.getValues('content') || '';
    
    let newText;
    let cursorPosition;
    
    if (format === '****') {
      // For headings, place cursor between **
      newText = currentValue.slice(0, start) + '**' + currentValue.slice(start, end) + '**' + currentValue.slice(end);
      cursorPosition = start + 2;
    } else {
      // For other formats, insert at cursor
      newText = currentValue.slice(0, start) + format + currentValue.slice(end);
      cursorPosition = start + format.length;
    }
    
    // Update form value and trigger re-render
    form.setValue('content', newText, { shouldValidate: true });
    
    // Set cursor position after React re-render
    requestAnimationFrame(() => {
      if (textarea) {
        textarea.setSelectionRange(cursorPosition, cursorPosition);
        textarea.focus();
      }
    });
  };

  // Wrap selected text with formatting
  const wrapSelection = (startFormat: string, endFormat: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = form.getValues('content') || '';
    
    if (start !== end) {
      const selectedText = currentValue.slice(start, end);
      const newText = currentValue.slice(0, start) + startFormat + selectedText + endFormat + currentValue.slice(end);
      
      form.setValue('content', newText, { shouldValidate: true });
      
      requestAnimationFrame(() => {
        if (textarea) {
          const newCursorPos = start + startFormat.length + selectedText.length + endFormat.length;
          textarea.setSelectionRange(newCursorPos, newCursorPos);
          textarea.focus();
        }
      });
    } else {
      // If no selection, just insert the format markers
      insertFormatting(startFormat + endFormat);
    }
  };

  const viewNoteDetails = (note: any) => {
    setSelectedNote(note);
    setShowDetailDialog(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Notes Management</h2>
          <p className="text-muted-foreground">Manage educational notes and study materials</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingNote ? 'Edit Note' : 'Add New Note'}</DialogTitle>
              <DialogDescription>
                Use formatting like **Heading**, ## Sub-heading, and * Bullet points to structure your content
              </DialogDescription>
            </DialogHeader>
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
                          <Input placeholder="e.g., Anatomy, Surgery, Diagnosis" {...field} />
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
                      <FormLabel className="flex items-center justify-between">
                        <span>Content *</span>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPreview(!showPreview)}
                            className="flex items-center gap-1"
                          >
                            {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            {showPreview ? 'Edit' : 'Preview'}
                          </Button>
                        </div>
                      </FormLabel>
                      
                      {/* Formatting Toolbar */}
                      <div className="flex flex-wrap gap-2 p-2 bg-muted rounded-lg border">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => insertFormatting('****')}
                          className="flex items-center gap-1 text-xs"
                        >
                          <Type className="h-3 w-3" />
                          Heading
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => insertFormatting('## ')}
                          className="flex items-center gap-1 text-xs"
                        >
                          <Hash className="h-3 w-3" />
                          Sub-heading
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => insertFormatting('* ')}
                          className="flex items-center gap-1 text-xs"
                        >
                          <List className="h-3 w-3" />
                          Bullet
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => wrapSelection('**', '**')}
                          className="flex items-center gap-1 text-xs"
                        >
                          <Bold className="h-3 w-3" />
                          Bold
                        </Button>
                      </div>
                      
                      <Tabs value={showPreview ? "preview" : "edit"} className="w-full">
                        <TabsContent value="edit">
                          <FormControl>
                            <Textarea 
                              ref={textareaRef}
                              placeholder="Enter note content with formatting:&#10;**Main Heading**&#10;## Sub-heading&#10;* Bullet point&#10;Regular text"
                              rows={12}
                              className="font-mono"
                              dir="auto"
                              style={{ textAlign: 'left', direction: 'ltr' }}
                              {...field}
                            />
                          </FormControl>
                        </TabsContent>
                        <TabsContent value="preview">
                          <div className="min-h-[300px] p-4 border rounded-md bg-background" dir="auto">
                            {field.value ? (
                              <div className="prose max-w-none">
                                {formatTextContent(field.value)}
                              </div>
                            ) : (
                              <p className="text-muted-foreground">Preview will appear here...</p>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                      
                      <div className="text-xs text-muted-foreground">
                        <strong>Formatting Guide:</strong> **Text** = Heading, ## Text = Sub-heading, * Text = Bullet point
                      </div>
                      
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createNoteMutation.isPending || updateNoteMutation.isPending}>
                    {createNoteMutation.isPending || updateNoteMutation.isPending 
                      ? "Saving..." 
                      : (editingNote ? "Update Note" : "Add Note")
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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
            <div className="overflow-x-auto">
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
                    <TableCell className="max-w-xs">
                      <div className="space-y-1">
                        <div className="truncate text-sm">
                          {note.content ? note.content.substring(0, 80) + '...' : '-'}
                        </div>
                        {note.content && note.content.length > 80 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewNoteDetails(note)}
                            className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            View Full Content
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
            </div>
          )}
          </div>
        </CardContent>
      </Card>

      {/* Note Detail View Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedNote?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedNote?.category && (
                <Badge variant="secondary" className="mt-2">
                  {selectedNote.category}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4" dir="auto">
            {selectedNote?.content ? (
              <div className="prose max-w-none">
                {formatTextContent(selectedNote.content)}
              </div>
            ) : (
              <p className="text-muted-foreground">No content available.</p>
            )}
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowDetailDialog(false);
              handleEdit(selectedNote);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Note
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
