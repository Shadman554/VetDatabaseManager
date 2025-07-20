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
import { useState } from "react";
import { Edit, Trash2, Plus, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function NormalRanges() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingRange, setEditingRange] = useState<any>(null);
  
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

  let ranges: any[] = [];
  if (rangesResponse) {
    ranges = Array.isArray(rangesResponse) ? rangesResponse : rangesResponse.items || [];
  }

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
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Range
        </Button>
      </div>

      {/* Normal Ranges Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Normal Ranges ({ranges.length})</CardTitle>
        </CardHeader>
        <CardContent>
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
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Range
              </Button>
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
                  <TableRow key={range.name || range.id || index}>
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
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{editingRange ? 'Edit Normal Range' : 'Add New Normal Range'}</CardTitle>
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
        </CardContent>
        </Card>
      )}
    </div>
  );
}
