import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { drugSchema } from "@shared/schema";
import { api } from "@/lib/api";
import { useState } from "react";
import { Edit, Trash2, Plus, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Drugs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingDrug, setEditingDrug] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(drugSchema),
    defaultValues: {
      name: "",
      usage: "",
      side_effect: "",
      other_info: "",
      drug_class: "",
    },
  });

  // Fetch drugs
  const { data: drugsResponse, isLoading, error } = useQuery({
    queryKey: ['drugs'],
    queryFn: async () => {
      try {
        const response = await api.drugs.getAll();
        console.log('Drugs API response:', response);
        return response;
      } catch (err) {
        console.error('Drugs API error:', err);
        throw err;
      }
    },
  });

  // Handle different API response formats
  let drugs = [];
  if (drugsResponse) {
    if (Array.isArray(drugsResponse)) {
      drugs = drugsResponse;
    } else if (drugsResponse.items && Array.isArray(drugsResponse.items)) {
      drugs = drugsResponse.items;
    } else if (drugsResponse.drugs && Array.isArray(drugsResponse.drugs)) {
      drugs = drugsResponse.drugs;
    } else if (drugsResponse.data && Array.isArray(drugsResponse.data)) {
      drugs = drugsResponse.data;
    } else {
      console.warn('Unexpected drugs response format:', drugsResponse);
      drugs = [];
    }
  }

  const createDrugMutation = useMutation({
    mutationFn: api.drugs.create,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Drug has been added successfully",
      });
      form.reset();
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['drugs'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add drug: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateDrugMutation = useMutation({
    mutationFn: ({ name, data }: { name: string; data: any }) => api.drugs.update(name, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Drug has been updated successfully",
      });
      form.reset();
      setEditingDrug(null);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['drugs'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update drug: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteDrugMutation = useMutation({
    mutationFn: api.drugs.delete,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Drug has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['drugs'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete drug: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (editingDrug) {
      updateDrugMutation.mutate({ name: editingDrug.name, data });
    } else {
      createDrugMutation.mutate(data);
    }
  };

  const handleEdit = (drug: any) => {
    setEditingDrug(drug);
    form.reset({
      name: drug.name || "",
      usage: drug.usage || "",
      side_effect: drug.side_effect || "",
      other_info: drug.other_info || "",
      drug_class: drug.drug_class || "",
    });
    setShowForm(true);
  };

  const handleDelete = (name: string) => {
    deleteDrugMutation.mutate(name);
  };

  const handleCancelEdit = () => {
    setEditingDrug(null);
    setShowForm(false);
    form.reset();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Drugs Management</h2>
          <p className="text-gray-600">Manage pharmaceutical information with detailed drug data</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Drug
        </Button>
      </div>

      {/* Drugs Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Drugs ({drugs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">Failed to load drugs</div>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['drugs'] })}>
                Retry
              </Button>
            </div>
          ) : drugs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">💊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No drugs yet</h3>
              <p className="text-sm text-gray-600 mb-4">
                Start by adding your first pharmaceutical information
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Drug
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Drug Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Side Effects</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drugs.map((drug: any, index: number) => (
                  <TableRow key={drug.name || index}>
                    <TableCell className="font-medium">{drug.name}</TableCell>
                    <TableCell>
                      {drug.drug_class && (
                        <Badge variant="secondary">{drug.drug_class}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {drug.usage ? drug.usage.substring(0, 60) + '...' : '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {drug.side_effect ? drug.side_effect.substring(0, 60) + '...' : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(drug)}
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
                              <AlertDialogTitle>Delete Drug</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{drug.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(drug.name)}
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
              {editingDrug ? 'Edit Drug' : 'Add New Drug'}
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
                        <FormLabel>Drug Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter drug name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="drug_class"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Drug Class</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select drug class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="antibiotic">Antibiotic</SelectItem>
                            <SelectItem value="analgesic">Analgesic</SelectItem>
                            <SelectItem value="anti-inflammatory">Anti-inflammatory</SelectItem>
                            <SelectItem value="anesthetic">Anesthetic</SelectItem>
                            <SelectItem value="antifungal">Antifungal</SelectItem>
                            <SelectItem value="antiviral">Antiviral</SelectItem>
                            <SelectItem value="antiparasitic">Antiparasitic</SelectItem>
                            <SelectItem value="vaccine">Vaccine</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="usage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usage/Indication</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe when and how to use this drug"
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
                  name="side_effect"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Side Effects</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List potential side effects and adverse reactions"
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
                  name="other_info"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Information</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Dosage, contraindications, storage, etc."
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
                    disabled={createDrugMutation.isPending || updateDrugMutation.isPending}
                  >
                    {createDrugMutation.isPending || updateDrugMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        {editingDrug ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      editingDrug ? 'Update Drug' : 'Add Drug'
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

