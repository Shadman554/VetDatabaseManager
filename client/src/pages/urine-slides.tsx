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
import { urineSlideSchema } from "@shared/schema";
import { api } from "@/lib/api";
import { useState } from "react";
import { Edit, Trash2, Plus, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function UrineSlides() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingSlide, setEditingSlide] = useState<any>(null);
  
  const form = useForm({
    resolver: zodResolver(urineSlideSchema),
    defaultValues: {
      name: "",
      description: "",
      findings: "",
      image_url: "",
    },
  });

  // Fetch urine slides
  const { data: slidesResponse, isLoading, error } = useQuery({
    queryKey: ['urine-slides'],
    queryFn: api.urineSlides.getAll,
  });

  let slides: any[] = [];
  if (slidesResponse) {
    slides = Array.isArray(slidesResponse) ? slidesResponse : slidesResponse.items || [];
  }

  const createSlideMutation = useMutation({
    mutationFn: api.urineSlides.create,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Urine slide has been added successfully",
      });
      form.reset();
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['urine-slides'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add urine slide: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateSlideMutation = useMutation({
    mutationFn: ({ name, data }: { name: string; data: any }) => api.urineSlides.update(name, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Urine slide has been updated successfully",
      });
      form.reset();
      setEditingSlide(null);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['urine-slides'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update urine slide: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteSlideMutation = useMutation({
    mutationFn: (name: string) => api.urineSlides.delete(name),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Urine slide has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['urine-slides'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete urine slide: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (editingSlide) {
      updateSlideMutation.mutate({ name: editingSlide.name, data });
    } else {
      createSlideMutation.mutate(data);
    }
  };

  const handleEdit = (slide: any) => {
    setEditingSlide(slide);
    form.reset({
      name: slide.name || "",
      description: slide.description || "",
      findings: slide.findings || "",
      image_url: slide.image_url || "",
    });
    setShowForm(true);
  };

  const handleDelete = (name: string) => {
    deleteSlideMutation.mutate(name);
  };

  const handleCancelEdit = () => {
    setEditingSlide(null);
    setShowForm(false);
    form.reset();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Urine Slides Management</h2>
          <p className="text-muted-foreground">Manage urine microscopy slide images and findings</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Slide
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Urine Slides Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Urine Slides ({slides.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">Failed to load urine slides</div>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['urine-slides'] })}>
                Retry
              </Button>
            </div>
          ) : slides.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🔬</div>
              <h3 className="text-lg font-medium text-foreground mb-2">No urine slides yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start by adding your first urine microscopy slide
              </p>
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Slide
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Findings</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slides.map((slide: any, index: number) => (
                  <TableRow key={slide.name || slide.id || index}>
                    <TableCell className="font-medium">{slide.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {slide.description ? slide.description.substring(0, 60) + '...' : '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {slide.findings ? slide.findings.substring(0, 60) + '...' : '-'}
                    </TableCell>
                    <TableCell>
                      {slide.image_url ? (
                        <img src={slide.image_url} alt={slide.name} className="w-16 h-16 object-cover rounded" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-xs">No Image</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
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
                              <AlertDialogTitle>Delete Urine Slide</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{slide.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(slide.name)}
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
        </CardContent>
      </Card>

      {/* Add/Edit Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSlide ? 'Edit Urine Slide' : 'Add New Urine Slide'}
            </DialogTitle>
            <DialogDescription>
              {editingSlide 
                ? 'Update the urine slide information and microscopic findings.' 
                : 'Add a new urine microscopy slide with detailed findings.'
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slide Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Normal Urine, Bacterial Infection, Crystals" {...field} />
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
                        placeholder="Brief description of the urine sample and case background"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="findings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Microscopic Findings</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed microscopic findings: cells, crystals, bacteria, casts, etc."
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
                      <Input 
                        type="url"
                        placeholder="https://example.com/slide-image.jpg"
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
                  disabled={createSlideMutation.isPending || updateSlideMutation.isPending}
                >
                  {createSlideMutation.isPending || updateSlideMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      {editingSlide ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    editingSlide ? 'Update Slide' : 'Add Slide'
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
