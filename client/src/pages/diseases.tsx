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
import { useState, useMemo } from "react";
import { Edit, Trash2, Plus, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import SearchFilterSort from "@/components/ui/search-filter-sort";

export default function Diseases() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingDisease, setEditingDisease] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  
  // Search, filter, and sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  
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
  const { data: diseasesResponse, isLoading, error } = useQuery({
    queryKey: ['diseases'],
    queryFn: async () => {
      try {
        const response = await api.diseases.getAll();
        console.log('Diseases API response:', response);
        return response;
      } catch (err) {
        console.error('Diseases API error:', err);
        throw err;
      }
    },
  });

  // Handle different API response formats - ensure we always have an array
  let allDiseases = [];
  if (diseasesResponse) {
    if (Array.isArray(diseasesResponse)) {
      allDiseases = diseasesResponse;
    } else if (diseasesResponse.items && Array.isArray(diseasesResponse.items)) {
      allDiseases = diseasesResponse.items;
    } else if (diseasesResponse.diseases && Array.isArray(diseasesResponse.diseases)) {
      allDiseases = diseasesResponse.diseases;
    } else if (diseasesResponse.data && Array.isArray(diseasesResponse.data)) {
      allDiseases = diseasesResponse.data;
    } else if (diseasesResponse.results && Array.isArray(diseasesResponse.results)) {
      allDiseases = diseasesResponse.results;
    } else {
      console.warn('Unexpected diseases response format:', diseasesResponse);
      allDiseases = [];
    }
  }

  // Filter, search, and sort diseases
  const filteredAndSortedDiseases = useMemo(() => {
    let filtered = [...allDiseases];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((disease: any) =>
        disease.name?.toLowerCase().includes(search) ||
        disease.kurdish?.toLowerCase().includes(search) ||
        disease.symptoms?.toLowerCase().includes(search) ||
        disease.cause?.toLowerCase().includes(search) ||
        disease.control?.toLowerCase().includes(search)
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
        case 'kurdish':
          aValue = a.kurdish || '';
          bValue = b.kurdish || '';
          break;
        default:
          aValue = a.name || '';
          bValue = b.name || '';
      }

      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [allDiseases, searchTerm, sortBy, sortDirection]);

  const diseases = filteredAndSortedDiseases;

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
    mutationFn: ({ name, data }: { name: string; data: any }) => api.diseases.update(name, data),
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
      updateDiseaseMutation.mutate({ name: editingDisease.name, data });
    } else {
      createDiseaseMutation.mutate(data);
    }
  };

  const handleDelete = (name: string) => {
    deleteDiseaseMutation.mutate(name);
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



  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Diseases Management</h2>
          <p className="text-muted-foreground">Manage disease information with multilingual support</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Disease
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingDisease ? 'Edit Disease' : 'Add New Disease'}</DialogTitle>
            </DialogHeader>
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
                        <FormLabel>Disease Name (Kurdish) *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter disease name in Kurdish" {...field} />
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
                      <FormLabel>Symptoms *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the symptoms of the disease"
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
                  name="cause"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cause *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the cause of the disease"
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
                  name="control"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Control/Treatment *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe prevention and treatment methods"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createDiseaseMutation.isPending || updateDiseaseMutation.isPending}>
                    {createDiseaseMutation.isPending || updateDiseaseMutation.isPending 
                      ? "Saving..." 
                      : (editingDisease ? "Update Disease" : "Add Disease")
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Diseases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Diseases Database</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search, Filter, and Sort Controls */}
          <SearchFilterSort
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortOptions={[
              { value: "name", label: "English Name", key: "name" },
              { value: "kurdish", label: "Kurdish Name", key: "kurdish" },
            ]}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortChange={(key, direction) => {
              setSortBy(key);
              setSortDirection(direction);
            }}
            filterOptions={[]} // No additional filters for diseases
            activeFilters={activeFilters}
            onFilterChange={(key, value) => {
              setActiveFilters(prev => ({ ...prev, [key]: value }));
            }}
            onClearFilters={() => setActiveFilters({})}
            placeholder="Search diseases by name, symptoms, cause, or control..."
            totalItems={allDiseases.length}
            filteredItems={diseases.length}
          />
          
          <div className="mt-6">
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
                                onClick={() => handleDelete(disease.name)}
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


    </div>
  );
}
