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
import { otherSlideSchema } from "@shared/schema";
import { api } from "@/lib/api";
import { useState, useMemo } from "react";
import { Edit, Trash2, Plus, ExternalLink } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SearchFilterSort from "@/components/ui/search-filter-sort";

export default function OtherSlides() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingSlide, setEditingSlide] = useState<any>(null);
  
  // Search, filter, and sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  // Removed italic slides state to prevent database corruption issues
  
  const form = useForm({
    resolver: zodResolver(otherSlideSchema),
    defaultValues: {
      slide_name: "",
      scientific_name: "",
      description: "",
      image_url: "",
    },
  });

  // Fetch other slides
  const { data: slidesResponse, isLoading, error } = useQuery({
    queryKey: ['otherSlides'],
    queryFn: async () => {
      try {
        const response = await api.otherSlides.getAll();
        console.log('Other Slides API response:', response);
        return response;
      } catch (err) {
        console.error('Other Slides API error:', err);
        throw err;
      }
    },
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('Network error')) {
        return failureCount < 1;
      }
      return failureCount < 3;
    },
    retryDelay: 1000,
  });

  // Handle different API response formats
  let allSlides = [];
  if (slidesResponse) {
    if (Array.isArray(slidesResponse)) {
      allSlides = slidesResponse;
    } else if (slidesResponse.items && Array.isArray(slidesResponse.items)) {
      allSlides = slidesResponse.items;
    } else if (slidesResponse.data && Array.isArray(slidesResponse.data)) {
      allSlides = slidesResponse.data;
    } else {
      console.warn('Unexpected slides response format:', slidesResponse);
      allSlides = [];
    }
  }

  // Filter, search, and sort slides
  const filteredAndSortedSlides = useMemo(() => {
    let filtered = [...allSlides];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((slide: any) =>
        (slide.name || slide.slide_name)?.toLowerCase().includes(search) ||
        slide.description?.toLowerCase().includes(search)
      );
    }

    // Sort slides
    filtered.sort((a: any, b: any) => {
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      
      if (sortDirection === 'asc') {
        return aVal.localeCompare(bVal, undefined, { numeric: true });
      } else {
        return bVal.localeCompare(aVal, undefined, { numeric: true });
      }
    });

    return filtered;
  }, [allSlides, searchTerm, sortBy, sortDirection]);

  const slides = filteredAndSortedSlides;

  const createSlideMutation = useMutation({
    mutationFn: api.otherSlides.create,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Other slide has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['otherSlides'] });
      setShowForm(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create slide: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateSlideMutation = useMutation({
    mutationFn: ({ slide_name, data }: { slide_name: string; data: any }) => 
      api.otherSlides.update(slide_name, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Other slide has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['otherSlides'] });
      setShowForm(false);
      setEditingSlide(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update slide: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteSlideMutation = useMutation({
    mutationFn: api.otherSlides.delete,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Other slide has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['otherSlides'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete slide: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    // Transform slide_name to name for API compatibility
    const apiData = {
      ...data,
      name: data.slide_name
    };
    delete apiData.slide_name;

    if (editingSlide) {
      const slideName = editingSlide.name || editingSlide.slide_name;
      updateSlideMutation.mutate({ slide_name: slideName, data: apiData });
    } else {
      createSlideMutation.mutate(apiData);
    }
  };

  // Removed toggleItalic functionality to prevent unintended database updates

  const handleEdit = (slide: any) => {
    setEditingSlide(slide);
    form.reset({
      slide_name: slide.name || slide.slide_name || "",
      scientific_name: slide.scientific_name || "",
      description: slide.description || "",
      image_url: slide.image_url || "",
    });
    setShowForm(true);
  };

  const handleDelete = (slide_name: string) => {
    deleteSlideMutation.mutate(slide_name);
  };

  const handleCancelEdit = () => {
    setEditingSlide(null);
    setShowForm(false);
    form.reset();
  };

  if (error) {
    console.error('Other Slides page error:', error);
    return (
      <div className="p-6">
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md mb-4">
          Error loading other slides: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Refresh Page
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Other Slides Management</h2>
          <p className="text-muted-foreground">Manage microscopic slides and laboratory samples</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Slide
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl mx-4 sm:mx-0">
            <DialogHeader>
              <DialogTitle>{editingSlide ? 'Edit Other Slide' : 'Add New Other Slide'}</DialogTitle>
              <DialogDescription>
                Add microscopic slide information and image references
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="slide_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slide Name *</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input placeholder="Enter slide name" {...field} />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const currentValue = field.value || "";
                              if (currentValue.includes("{") && currentValue.includes("}")) {
                                // Remove braces if they exist
                                const newValue = currentValue.replace(/[{}]/g, "");
                                field.onChange(newValue);
                              } else {
                                // Add braces for scientific name
                                field.onChange(`{${currentValue}}`);
                              }
                            }}
                            className="h-10 w-10 p-0"
                            title="Toggle scientific name formatting (italic with braces)"
                          >
                            <span className="text-sm font-bold italic">I</span>
                          </Button>
                        </div>
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
                          placeholder="Enter slide description and findings"
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
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/slide-image.jpg (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createSlideMutation.isPending || updateSlideMutation.isPending}>
                    {createSlideMutation.isPending || updateSlideMutation.isPending 
                      ? "Saving..." 
                      : (editingSlide ? "Update Slide" : "Add Slide")
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Slides Table */}
      <Card>
        <CardHeader>
          <CardTitle>Other Slides Database</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search, Filter, and Sort Controls */}
          <SearchFilterSort
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortOptions={[
              { value: "name", label: "Slide Name", key: "name" },
              { value: "slide_name", label: "Slide Name (Alt)", key: "slide_name" },
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
            placeholder="Search slides by name or description..."
            totalItems={allSlides.length}
            filteredItems={slides.length}
          />
          
          <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">Failed to load other slides</div>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['otherSlides'] })}>
                Retry
              </Button>
            </div>
          ) : slides.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🔬</div>
              <h3 className="text-lg font-medium text-foreground mb-2">No slides yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start by adding your first microscopic slide
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Slide
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>Slide Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slides.map((slide: any, index: number) => (
                  <TableRow key={slide.name || slide.slide_name || slide.id || index}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>
                          {slide.name || slide.slide_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate text-sm">
                        {slide.description ? slide.description.substring(0, 100) + '...' : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {slide.image_url ? (
                        <a 
                          href={slide.image_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Image
                        </a>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(slide)}
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
                              <AlertDialogTitle>Delete Slide</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{slide.name || slide.slide_name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(slide.name || slide.slide_name)}
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
    </div>
  );
}