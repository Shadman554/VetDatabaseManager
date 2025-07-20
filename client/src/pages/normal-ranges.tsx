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
import { normalRangeSchema } from "@shared/schema";
import { api } from "@/lib/api";
import { useState, useMemo } from "react";
import { Edit, Trash2, Plus, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import SearchFilterSort from "@/components/ui/search-filter-sort";

export default function NormalRanges() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingRange, setEditingRange] = useState<any>(null);
  
  // Search, filter, and sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  
  const form = useForm({
    resolver: zodResolver(normalRangeSchema),
    defaultValues: {
      name: "",
      species: "",
      category: "",
      min_value: undefined,
      max_value: undefined,
      unit: "",
      notes: "",
    },
  });

  // Fetch normal ranges
  const { data: rangesResponse, isLoading, error } = useQuery({
    queryKey: ['normal-ranges'],
    queryFn: api.normalRanges.getAll,
  });

  let allRanges: any[] = [];
  if (rangesResponse) {
    allRanges = Array.isArray(rangesResponse) ? rangesResponse : rangesResponse.items || [];
  }

  // Get unique species and categories for filtering
  const species = useMemo(() => {
    const specs = Array.from(new Set(allRanges.map((range: any) => range.species).filter(Boolean))) as string[];
    return specs.sort();
  }, [allRanges]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(allRanges.map((range: any) => range.category).filter(Boolean))) as string[];
    return cats.sort();
  }, [allRanges]);

  // Filter, search, and sort ranges
  const filteredAndSortedRanges = useMemo(() => {
    let filtered = [...allRanges];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((range: any) =>
        range.name?.toLowerCase().includes(search) ||
        range.species?.toLowerCase().includes(search) ||
        range.category?.toLowerCase().includes(search) ||
        range.unit?.toLowerCase().includes(search) ||
        range.notes?.toLowerCase().includes(search)
      );
    }

    // Apply filters
    if (activeFilters.species) {
      filtered = filtered.filter((range: any) => range.species === activeFilters.species);
    }
    if (activeFilters.category) {
      filtered = filtered.filter((range: any) => range.category === activeFilters.category);
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
        case 'species':
          aValue = a.species || '';
          bValue = b.species || '';
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
  }, [allRanges, searchTerm, activeFilters, sortBy, sortDirection]);

  const ranges = filteredAndSortedRanges;

  const createRangeMutation = useMutation({
    mutationFn: api.normalRanges.create,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Normal range has been added successfully",
      });
      form.reset();
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['normal-ranges'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add normal range: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateRangeMutation = useMutation({
    mutationFn: ({ name, data }: { name: string; data: any }) => api.normalRanges.update(name, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Normal range has been updated successfully",
      });
      form.reset();
      setEditingRange(null);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['normal-ranges'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update normal range: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteRangeMutation = useMutation({
    mutationFn: api.normalRanges.delete,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Normal range has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['normal-ranges'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete normal range: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (editingRange) {
      updateRangeMutation.mutate({ name: editingRange.name, data });
    } else {
      createRangeMutation.mutate(data);
    }
  };

  const handleEdit = (range: any) => {
    setEditingRange(range);
    form.reset({
      name: range.name || "",
      species: range.species || "",
      category: range.category || "",
      min_value: range.min_value,
      max_value: range.max_value,
      unit: range.unit || "",
      notes: range.notes || "",
    });
    setShowForm(true);
  };

  const handleDelete = (name: string) => {
    deleteRangeMutation.mutate(name);
  };

  const handleCancelEdit = () => {
    setEditingRange(null);
    setShowForm(false);
    form.reset();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Normal Ranges Management</h2>
          <p className="text-gray-600">Manage normal laboratory and clinical ranges</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Range
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Normal Ranges Table */}
      <Card>
        <CardHeader>
          <CardTitle>Normal Ranges Database</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search, Filter, and Sort Controls */}
          <SearchFilterSort
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortOptions={[
              { value: "name", label: "Parameter Name", key: "name" },
              { value: "species", label: "Species", key: "species" },
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
                key: "species",
                label: "Species",
                options: species.map((spec: string) => ({ value: spec, label: spec })),
              },
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
            placeholder="Search normal ranges by parameter, species, or unit..."
            totalItems={allRanges.length}
            filteredItems={ranges.length}
          />
          
          <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">Failed to load normal ranges</div>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['normal-ranges'] })}>
                Retry
              </Button>
            </div>
          ) : ranges.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🔬</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No normal ranges yet</h3>
              <p className="text-sm text-gray-600 mb-4">
                Start by adding your first normal range reference
              </p>
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Range
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parameter</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Range</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranges.map((range: any, index: number) => (
                  <TableRow key={`${range.name}-${range.species || 'unknown'}-${range.id || index}`}>
                    <TableCell className="font-medium">{range.name}</TableCell>
                    <TableCell>{range.species || '-'}</TableCell>
                    <TableCell>{range.category || '-'}</TableCell>
                    <TableCell>
                      {range.min_value !== undefined && range.max_value !== undefined 
                        ? `${range.min_value} - ${range.max_value}`
                        : range.min_value !== undefined
                        ? `≥ ${range.min_value}`
                        : range.max_value !== undefined
                        ? `≤ ${range.max_value}`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{range.unit || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(range)}
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
                              <AlertDialogTitle>Delete Normal Range</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{range.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(range.name)}
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

      {/* Add/Edit Form Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRange ? 'Edit Normal Range' : 'Add New Normal Range'}
            </DialogTitle>
            <DialogDescription>
              {editingRange 
                ? 'Modify the normal range parameters and reference values.' 
                : 'Enter the details for a new normal range reference.'
              }
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
                      <FormLabel>Parameter Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Heart Rate, Temperature, WBC Count" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="species"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Species</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Canine, Feline, Equine" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Hematology, Biochemistry, Vital Signs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="min_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Value</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="0.0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="max_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Value</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="100.0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., mg/dL, bpm, °C" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional notes, age considerations, conditions affecting range, etc."
                        rows={3}
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
                  disabled={createRangeMutation.isPending || updateRangeMutation.isPending}
                >
                  {createRangeMutation.isPending || updateRangeMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      {editingRange ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    editingRange ? 'Update Range' : 'Add Range'
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
