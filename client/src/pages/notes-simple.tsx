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

interface NoteFormData {
  name: string;
  image_url?: string;
  sections: Section[];
}

export default function NotesSimple() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [selectedNote, setSelectedNote] = useState<any>(null);
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

  // Fetch notes
  const { data: notesResponse, isLoading, error } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      try {
        const response = await api.notes.getAll();
        return response;
      } catch (err) {
        console.error('Notes API error:', err);
        throw err;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Handle different API response formats
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
      resetForm();
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
      resetForm();
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

  const resetForm = () => {
    form.reset();
    setSections([{ title: "", content: "", image_url: "" }]);
    setEditingNote(null);
  };

  const addSection = () => {
    setSections([...sections, { title: "", content: "", image_url: "" }]);
  };

  const removeSection = (index: number) => {
    if (sections.length > 1) {
      setSections(sections.filter((_, i) => i !== index));
    }
  };

  const updateSection = (index: number, field: 'title' | 'content' | 'image_url', value: string) => {
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

    const noteData = {
      ...data,
      description: JSON.stringify(structuredDescription)
    };

    if (editingNote) {
      updateNoteMutation.mutate({ name: editingNote.name, data: noteData });
    } else {
      createNoteMutation.mutate(noteData);
    }
  };

  const openEditDialog = (note: any) => {
    setEditingNote(note);
    form.setValue('name', note.name || '');
    form.setValue('image_url', note.image_url || '');
    
    // Parse existing description if it's JSON
    try {
      const parsed = JSON.parse(note.description || '{}');
      if (parsed.sections && Array.isArray(parsed.sections)) {
        // Ensure all sections have image_url field for backward compatibility
        const sectionsWithImageUrl = parsed.sections.map((section: any) => ({
          title: section.title || "",
          content: section.content || "",
          image_url: section.image_url || ""
        }));
        setSections(sectionsWithImageUrl.length > 0 ? sectionsWithImageUrl : [{ title: "", content: "", image_url: "" }]);
      } else {
        setSections([{ title: "", content: note.description || "", image_url: "" }]);
      }
    } catch {
      setSections([{ title: "", content: note.description || "", image_url: "" }]);
    }
    
    setShowForm(true);
  };

  const openAddDialog = () => {
    resetForm();
    setShowForm(true);
  };

  const openDetailDialog = (note: any) => {
    setSelectedNote(note);
    setShowDetailDialog(true);
  };

  const renderNoteContent = (description: string) => {
    try {
      const parsed = JSON.parse(description);
      if (parsed.sections && Array.isArray(parsed.sections)) {
        return (
          <div className="space-y-4">
            {parsed.sections.map((section: any, index: number) => (
              <div key={index} className="border-l-4 border-blue-200 pl-4">
                {section.title && (
                  <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2" dir="auto">
                    {section.title}
                  </h3>
                )}
                {section.image_url && (
                  <div className="mb-3">
                    <img
                      src={section.image_url}
                      alt={section.title || "Section image"}
                      className="max-w-full h-auto rounded-lg shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                {section.content && (
                  <div className="text-gray-700 dark:text-gray-300" dir="auto">
                    {section.content.split('\\n').map((line: string, i: number) => (
                      <div key={i} className="mb-1">
                        {line.startsWith('•') || line.startsWith('*') ? (
                          <div className="ml-4">{line}</div>
                        ) : (
                          <div>{line}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }
    } catch {
      // Fall back to plain text
    }
    
    return (
      <div className="text-gray-700 dark:text-gray-300" dir="auto">
        {description}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Error loading notes: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Notes Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Create and manage structured educational notes</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingNote ? 'Edit Note' : 'Add New Note'}</DialogTitle>
              <DialogDescription>
                Create structured notes with sections and content
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
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Content Sections</h3>
                    <Button type="button" onClick={addSection} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Section
                    </Button>
                  </div>
                  
                  {sections.map((section, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Section {index + 1}</label>
                          {sections.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeSection(index)}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                              Remove
                            </Button>
                          )}
                        </div>
                        
                        <Input
                          placeholder="Section title (e.g., دەرمانە ئازارپەککەرەکان)"
                          value={section.title}
                          onChange={(e) => updateSection(index, 'title', e.target.value)}
                          dir="auto"
                        />
                        
                        <Textarea
                          placeholder="Section content... Use • for bullet points"
                          value={section.content}
                          onChange={(e) => updateSection(index, 'content', e.target.value)}
                          rows={4}
                          dir="auto"
                        />
                        
                        <Input
                          placeholder="Section image URL (optional)"
                          value={section.image_url || ""}
                          onChange={(e) => updateSection(index, 'image_url', e.target.value)}
                          type="url"
                        />
                      </div>
                    </Card>
                  ))}
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={createNoteMutation.isPending || updateNoteMutation.isPending}>
                    {createNoteMutation.isPending || updateNoteMutation.isPending ? (
                      <LoadingSpinner />
                    ) : editingNote ? (
                      'Update Note'
                    ) : (
                      'Create Note'
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <SearchFilterSort
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
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
        totalItems={allNotes?.length || 0}
        filteredItems={notes?.length || 0}
      />

      {/* Notes List */}
      <div className="grid gap-4 md:gap-6">
        {notes.length > 0 ? (
          notes.map((note: any) => (
            <Card key={note.name || note.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg mb-2 break-words" dir="auto">
                      {note.name}
                    </CardTitle>
                    {note.image_url && (
                      <div className="text-sm text-muted-foreground mb-2">
                        <span className="inline-flex items-center gap-1">
                          📷 Image attached
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetailDialog(note)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(note)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
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
                            onClick={() => deleteNoteMutation.mutate(note.name)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="max-h-32 overflow-hidden">
                  {renderNoteContent(note.description)}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notes found</p>
              <p className="text-sm text-muted-foreground mt-2">Create your first note to get started</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl mx-4 sm:mx-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle dir="auto">{selectedNote?.name}</DialogTitle>
          </DialogHeader>
          {selectedNote && (
            <div className="space-y-4">
              {selectedNote.image_url && (
                <div className="w-full">
                  <img
                    src={selectedNote.image_url}
                    alt={selectedNote.name}
                    className="max-w-full h-auto rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="prose max-w-none">
                {renderNoteContent(selectedNote.description)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}