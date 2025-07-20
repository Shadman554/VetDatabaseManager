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
import { staffSchema } from "@shared/schema";
import { api } from "@/lib/api";
import { useState } from "react";
import { Edit, Trash2, Plus, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Staff() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      position: "",
      department: "",
      email: "",
      phone: "",
      bio: "",
    },
  });

  // Fetch staff
  const { data: staffResponse, isLoading, error } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      try {
        const response = await api.staff.getAll();
        console.log('Staff API response:', response);
        return response;
      } catch (err) {
        console.error('Staff API error:', err);
        throw err;
      }
    },
  });

  // Handle different API response formats
  let staff = [];
  if (staffResponse) {
    if (Array.isArray(staffResponse)) {
      staff = staffResponse;
    } else if (staffResponse.items && Array.isArray(staffResponse.items)) {
      staff = staffResponse.items;
    } else if (staffResponse.staff && Array.isArray(staffResponse.staff)) {
      staff = staffResponse.staff;
    } else if (staffResponse.data && Array.isArray(staffResponse.data)) {
      staff = staffResponse.data;
    } else {
      console.warn('Unexpected staff response format:', staffResponse);
      staff = [];
    }
  }

  const createStaffMutation = useMutation({
    mutationFn: api.staff.create,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Staff member has been added successfully",
      });
      form.reset();
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add staff member: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: ({ name, data }: { name: string; data: any }) => api.staff.update(name, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Staff member has been updated successfully",
      });
      form.reset();
      setEditingStaff(null);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update staff member: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: api.staff.delete,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Staff member has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete staff member: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (editingStaff) {
      updateStaffMutation.mutate({ name: editingStaff.name, data });
    } else {
      createStaffMutation.mutate(data);
    }
  };

  const handleEdit = (staffMember: any) => {
    setEditingStaff(staffMember);
    form.reset({
      name: staffMember.name || "",
      position: staffMember.position || "",
      department: staffMember.department || "",
      email: staffMember.email || "",
      phone: staffMember.phone || "",
      bio: staffMember.bio || "",
    });
    setShowForm(true);
  };

  const handleDelete = (name: string) => {
    deleteStaffMutation.mutate(name);
  };

  const handleCancelEdit = () => {
    setEditingStaff(null);
    setShowForm(false);
    form.reset();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Staff Management</h2>
          <p className="text-muted-foreground">Manage staff member information and contacts</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Staff Member
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Staff Members ({staff.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">Failed to load staff</div>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['staff'] })}>
                Retry
              </Button>
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-foreground mb-2">No staff members yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start by adding your first staff member
              </p>
              <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Staff Member
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member: any, index: number) => (
                  <TableRow key={member.name || index}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>
                      {member.position && (
                        <Badge variant="secondary">{member.position}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{member.department || '-'}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {member.email && <div>{member.email}</div>}
                        {member.phone && <div>{member.phone}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(member)}
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
                              <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{member.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(member.name)}
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
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Senior Veterinarian, Professor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Surgery, Internal Medicine" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="email@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biography</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief professional biography and qualifications"
                        rows={4}
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
                  disabled={createStaffMutation.isPending || updateStaffMutation.isPending}
                >
                  {createStaffMutation.isPending || updateStaffMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      {editingStaff ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    editingStaff ? 'Update Staff Member' : 'Add Staff Member'
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
