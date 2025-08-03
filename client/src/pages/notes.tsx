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
import { Edit, Trash2, Plus, X, Eye, EyeOff, Type, List, Hash, Bold, FileText, BookOpen, Code } from "lucide-react";
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
  const [showJsonMode, setShowJsonMode] = useState(false);
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
      description: "",
      image_url: "",
    },
  });

  // Fetch notes
  const { data: notesResponse, isLoading, error } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      try {
        const response = await api.notes.getAll();
        console.log('Notes API response:', response);
        return response;
      } catch (err) {
        console.error('Notes API error:', err);
        // Re-throw to let react-query handle it
        throw err;
      }
    },
    retry: (failureCount, error) => {
      // Don't retry network errors more than once
      if (error instanceof Error && error.message.includes('Network error')) {
        return failureCount < 1;
      }
      return failureCount < 3;
    },
    retryDelay: 1000,
  });

  // Handle different API response formats - ensure we always have an array
  let allNotes = [];
  if (notesResponse) {
    if (Array.isArray(notesResponse)) {
      allNotes = notesResponse;
    } else if (notesResponse.items && Array.isArray(notesResponse.items)) {
      allNotes = notesResponse.items;
    } else if (notesResponse.notes && Array.isArray(notesResponse.notes)) {
      allNotes = notesResponse.notes;
    } else if (notesResponse.data && Array.isArray(notesResponse.data)) {
      allNotes = notesResponse.data;
    } else if (notesResponse.results && Array.isArray(notesResponse.results)) {
      allNotes = notesResponse.results;
    } else {
      console.warn('Unexpected notes response format:', notesResponse);
      allNotes = [];
    }
  }

  // Filter, search, and sort notes
  const filteredAndSortedNotes = useMemo(() => {
    let filtered = [...allNotes];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((note: any) =>
        note.name?.toLowerCase().includes(search) ||
        note.description?.toLowerCase().includes(search)
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
      description: note.description || "",
      image_url: note.image_url || "",
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

  // Parse and format JSON structured content
  const parseJsonContent = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.sections) {
        const elements: JSX.Element[] = [];
        
        parsed.sections.forEach((section: any, index: number) => {
          // Section title
          if (section.title) {
            elements.push(
              <h2 key={`section-${index}-title`} className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-6 mb-3" dir="auto">
                {section.title}
              </h2>
            );
          }
          
          // Section content
          if (section.content) {
            const lines = section.content.split('\\n');
            lines.forEach((line: string, lineIndex: number) => {
              const trimmedLine = line.trim();
              if (!trimmedLine) {
                elements.push(<div key={`${index}-${lineIndex}-space`} className="h-2" />);
                return;
              }
              
              // Bullet points
              if (trimmedLine.startsWith('•') || trimmedLine.startsWith('*')) {
                elements.push(
                  <div key={`${index}-${lineIndex}`} className="ml-4 mb-1 text-gray-700 dark:text-gray-300" dir="auto">
                    {trimmedLine}
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
          }
        });
        
        return elements;
      }
    } catch (error) {
      // Not valid JSON, fall back to regular formatting
    }
    return null;
  };

  // Format text content for display (similar to Flutter app)
  const formatTextContent = (content: string) => {
    if (!content) return '';
    
    // First try to parse as JSON
    const jsonContent = parseJsonContent(content);
    if (jsonContent) {
      return jsonContent;
    }
    
    // Fall back to regular markdown-style formatting
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
    const currentValue = form.getValues('description') || '';
    
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
    form.setValue('description', newText, { shouldValidate: true });
    
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
    const currentValue = form.getValues('description') || '';
    
    if (start !== end) {
      const selectedText = currentValue.slice(start, end);
      const newText = currentValue.slice(0, start) + startFormat + selectedText + endFormat + currentValue.slice(end);
      
      form.setValue('description', newText, { shouldValidate: true });
      
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

  // Insert veterinary contraindications template
  const insertVetTemplate = () => {
    const template = {
      "sections": [
        {
          "title": "دەرمانە ئازارپەککەرەکان (Pain Relievers)",
          "content": "• پارسیتامۆل (Paracetamol) لە پشیلەکاندا قەدەغەیە\\n• دەرمانە پاراستامۆل و هەروەها ئەسپرین قەدەغەیە بۆ پشیلەکان و سەگەکان چونکە ژەهراوییە\\n• دەتوانیت ئەم دەرمانانە وەک جیگرەوەی بەکاربهینی: profien، meloxicam"
        },
        {
          "title": "دەرمانە ناوخۆییەکان (Internal Medications)",
          "content": "• خۆراک و ناوخۆییەکانی مرۆڤ قەدەغەن بۆ ئاژەڵان\\n• دەرمانەکانی تایبەت بە مرۆڤ زۆر قەدەغەن\\n• پێویستە دەرمانی تایبەت بە ئاژەڵ بەکار بهێنرێت"
        }
      ]
    };
    
    const jsonString = JSON.stringify(template, null, 2);
    form.setValue('description', jsonString, { shouldValidate: true });
    setShowJsonMode(true);
    setShowPreview(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Notes Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Manage educational notes and study materials</p>
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
                    name="image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/image.jpg (optional)" {...field} />
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
                      <FormLabel className="flex items-center justify-between">
                        <span>Description</span>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={insertVetTemplate}
                            className="flex items-center gap-1"
                          >
                            <BookOpen className="h-3 w-3" />
                            Vet Template
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowJsonMode(!showJsonMode)}
                            className="flex items-center gap-1"
                          >
                            <Code className="h-3 w-3" />
                            {showJsonMode ? 'Text' : 'JSON'}
                          </Button>
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
                      
                      {/* Formatting Toolbar - only show in text mode */}
                      {!showJsonMode && (
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
                      )}
                      
                      {/* JSON Mode Helper */}
                      {showJsonMode && (
                        <div className="text-sm text-muted-foreground p-2 bg-blue-50 dark:bg-blue-950/20 rounded border">
                          <p className="font-medium mb-1">JSON Structure Format:</p>
                          <p>• Use "sections" array with "title" and "content" fields</p>
                          <p>• Use \\n for line breaks in content</p>
                          <p>• Example: {`{"sections":[{"title":"Title","content":"Content\\nNew line"}]}`}</p>
                        </div>
                      )}
                      
                      <Tabs value={showPreview ? "preview" : "edit"} className="w-full">
                        <TabsContent value="edit">
                          <FormControl>
                            <Textarea 
                              placeholder={showJsonMode ? 
                                'Enter JSON structured content:&#10;{"sections":[{"title":"Title","content":"Content\\nNew line"}]}' :
                                'Enter note content with formatting:&#10;**Main Heading**&#10;## Sub-heading&#10;* Bullet point&#10;Regular text'
                              }
                              rows={12}
                              className="font-mono"
                              dir="auto"
                              style={{ textAlign: 'left', direction: 'ltr' }}
                              {...field}
                              ref={textareaRef}
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
                        <strong>Formatting Guide:</strong> 
                        {showJsonMode ? 
                          ' Use JSON structure with sections array for structured content' :
                          ' **Text** = Heading, ## Text = Sub-heading, * Text = Bullet point'
                        }
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
              { value: "description", label: "Description", key: "description" },
            ]}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortChange={(key, direction) => {
              setSortBy(key);
              setSortDirection(direction);
            }}
            filterOptions={[]}
            activeFilters={activeFilters}
            onFilterChange={(key, value) => {
              setActiveFilters(prev => ({ ...prev, [key]: value }));
            }}
            onClearFilters={() => setActiveFilters({})}
            placeholder="Search notes by title or description..."
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
                  <TableHead>Description</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notes.map((note: any, index: number) => (
                  <TableRow key={note.name || note.id || index}>
                    <TableCell className="font-medium">{note.name}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="space-y-1">
                        <div className="truncate text-sm">
                          {note.description ? note.description.substring(0, 80) + '...' : '-'}
                        </div>
                        {note.description && note.description.length > 80 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewNoteDetails(note)}
                            className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            View Full Description
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {note.image_url ? (
                        <a href={note.image_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                          View Image
                        </a>
                      ) : '-'}
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
              Note details and content
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4" dir="auto">
            {selectedNote?.description ? (
              <div className="prose max-w-none">
                {formatTextContent(selectedNote.description)}
              </div>
            ) : (
              <p className="text-muted-foreground">No description available.</p>
            )}
            {selectedNote?.image_url && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Image:</h4>
                <img src={selectedNote.image_url} alt={selectedNote.name} className="max-w-full h-auto rounded border" />
              </div>
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
