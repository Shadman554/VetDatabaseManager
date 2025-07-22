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
import { instrumentSchema } from "@shared/schema";
import { api } from "@/lib/api";
import { useState, useMemo } from "react";
import { Edit, Trash2, Plus, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import SearchFilterSort from "@/components/ui/search-filter-sort";

export default function Instruments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState<any>(null);
  
  // Search, filter, and sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  
  const form = useForm({
    resolver: zodResolver(instrumentSchema),
    defaultValues: {
      name: "",
      description: "",
      usage: "",
      category: "",
    },
  });

  // Fetch instruments
  const { data: instrumentsResponse, isLoading, error } = useQuery({
    queryKey: ['instruments'],
    queryFn: api.instruments.getAll,
  });

  let allInstruments: any[] = [];
  if (instrumentsResponse) {
    allInstruments = Array.isArray(instrumentsResponse) ? instrumentsResponse : instrumentsResponse.items || [];
  }

  // Get unique categories for filtering
  const categories = useMemo(() => {
    const cats = Array.from(new Set(allInstruments.map((instrument: any) => instrument.category).filter(Boolean))) as string[];
    return cats.sort();
  }, [allInstruments]);

  // Filter, search, and sort instruments
  const filteredAndSortedInstruments = useMemo(() => {
    let filtered = [...allInstruments];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((instrument: any) =>
        instrument.name?.toLowerCase().includes(search) ||
        instrument.description?.toLowerCase().includes(search) ||
        instrument.usage?.toLowerCase().includes(search) ||
        instrument.category?.toLowerCase().includes(search)
      );
    }

    // Apply category filter
    if (activeFilters.category) {
      filtered = filtered.filter((instrument: any) => instrument.category === activeFilters.category);
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
  }, [allInstruments, searchTerm, activeFilters, sortBy, sortDirection]);

  const instruments = filteredAndSortedInstruments;

  const createInstrumentMutation = useMutation({
    mutationFn: api.instruments.create,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Instrument has been added successfully",
      });
      form.reset();
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['instruments'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add instrument: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Note: Update and delete are not available for instruments API

  const onSubmit = (data: any) => {
    // Only create is available for instruments
    createInstrumentMutation.mutate(data);
  };

  const handleEdit = (instrument: any) => {
    // Edit functionality not available for instruments
    toast({
      title: "Feature not available",
      description: "Editing instruments is not supported by the API",
      variant: "destructive",
    });
  };

  const handleDelete = (name: string) => {
    // Delete functionality not available for instruments
    toast({
      title: "Feature not available", 
      description: "Deleting instruments is not supported by the API",
      variant: "destructive",
    });
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    form.reset();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Instruments Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Manage veterinary instruments and equipment</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Instrument
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Instrument</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instrument Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Stethoscope, Scalpel, Otoscope" {...field} />
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
                          <Input placeholder="e.g., Diagnostic, Surgical, Laboratory" {...field} />
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the instrument and its specifications"
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
                  name="usage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usage Instructions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="How to use the instrument, maintenance tips, safety considerations"
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
                  <Button type="submit" disabled={createInstrumentMutation.isPending}>
                    {createInstrumentMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Adding...
                      </>
                    ) : (
                      'Add Instrument'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Instruments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Instruments Database</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search, Filter, and Sort Controls */}
          <SearchFilterSort
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortOptions={[
              { value: "name", label: "Name", key: "name" },
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
            placeholder="Search instruments by name, usage, or description..."
            totalItems={allInstruments.length}
            filteredItems={instruments.length}
          />
          
          <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">Failed to load instruments</div>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['instruments'] })}>
                Retry
              </Button>
            </div>
          ) : instruments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🔧</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No instruments yet</h3>
              <p className="text-sm text-gray-600 mb-4">
                Start by adding your first veterinary instrument
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Instrument
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instruments.map((instrument: any, index: number) => (
                  <TableRow key={instrument.name || instrument.id || index}>
                    <TableCell className="font-medium">{instrument.name}</TableCell>
                    <TableCell>{instrument.category || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{instrument.usage || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {instrument.description ? instrument.description.substring(0, 60) + '...' : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        View only
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
