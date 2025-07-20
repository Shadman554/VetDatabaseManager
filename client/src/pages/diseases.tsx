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
import { diseaseSchema } from "@shared/schema";
import { api } from "@/lib/api";
import { useState } from "react";
import { Edit, Trash2, Plus, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Diseases() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingDisease, setEditingDisease] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(diseaseSchema),
    defaultValues: {
      name: "",
      kurdish: "",
      symptoms: "",
      cause: "",
      control: "",
    },
  });

  // Fetch diseases
  const { data: diseasesResponse, isLoading } = useQuery({
    queryKey: ['diseases'],
    queryFn: () => api.diseases.getAll(),
  });

  // Handle different API response formats
  const diseases = Array.isArray(diseasesResponse) ? diseasesResponse : 
                   diseasesResponse?.data ? diseasesResponse.data : 
                   diseasesResponse?.results ? diseasesResponse.results : [];

  // Create disease mutation
  const createDiseaseMutation = useMutation({
    mutationFn: api.diseases.create,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Disease has been added successfully",
      });
      form.reset();
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['diseases'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add disease: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update disease mutation
  const updateDiseaseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) => api.diseases.update(id, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Disease has been updated successfully",
      });
      form.reset();
      setEditingDisease(null);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['diseases'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update disease: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete disease mutation
  const deleteDiseaseMutation = useMutation({
    mutationFn: api.diseases.delete,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Disease has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['diseases'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete disease: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (editingDisease) {
      updateDiseaseMutation.mutate({ id: editingDisease.id, data });
    } else {
      createDiseaseMutation.mutate(data);
    }
  };

  const handleEdit = (disease: any) => {
    setEditingDisease(disease);
    form.reset({
      name: disease.name || "",
      kurdish: disease.kurdish || "",
      symptoms: disease.symptoms || "",
      cause: disease.cause || "",
      control: disease.control || "",
    });
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingDisease(null);
    setShowForm(false);
    form.reset();
  };

  const handleDelete = (id: string | number) => {
    deleteDiseaseMutation.mutate(id);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Diseases Management</h2>
          <p className="text-gray-600">Manage disease information with multilingual support</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Disease
        </Button>
      </div>

      {/* Diseases Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Diseases ({diseases.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : diseases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No diseases found. Add your first disease to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name (English)</TableHead>
                  <TableHead>Name (Kurdish)</TableHead>
                  <TableHead>Symptoms</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diseases.map((disease: any) => (
                  <TableRow key={disease.id}>
                    <TableCell className="font-medium">{disease.name}</TableCell>
                    <TableCell>{disease.kurdish || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {disease.symptoms ? disease.symptoms.substring(0, 60) + '...' : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(disease)}
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
                              <AlertDialogTitle>Delete Disease</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{disease.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(disease.id)}
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
      {showForm && (
        <Card className="border-2 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {editingDisease ? 'Edit Disease' : 'Add New Disease'}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Disease Name (English) *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter disease name in English" {...field} />
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
                        <FormLabel>Disease Name (Kurdish)</FormLabel>
                        <FormControl>
                          <Input placeholder="ناوی نەخۆشی بە کوردی" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="symptoms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Symptoms</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List main symptoms of the disease"
                          rows={3}
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
                    name="cause"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cause</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the cause of the disease"
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
                    name="control"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Control/Treatment</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Treatment and control measures"
                            rows={3}
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
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createDiseaseMutation.isPending || updateDiseaseMutation.isPending}>
                    {(createDiseaseMutation.isPending || updateDiseaseMutation.isPending) ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        {editingDisease ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      editingDisease ? 'Update Disease' : 'Add Disease'
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
