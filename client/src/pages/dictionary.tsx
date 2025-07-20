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
import { dictionarySchema } from "@shared/schema";
import { api } from "@/lib/api";
import { useState } from "react";
import { Edit, Trash2, Plus, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Dictionary() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm({
    resolver: zodResolver(dictionarySchema),
    defaultValues: {
      name: "",
      kurdish: "",
      arabic: "",
      description: "",
      barcode: "",
      is_saved: false,
      is_favorite: false,
    },
  });

  const createWordMutation = useMutation({
    mutationFn: api.dictionary.create,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dictionary term has been added successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['dictionary'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add dictionary term: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createWordMutation.mutate(data);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Dictionary Management</h2>
        <p className="text-gray-600">Add veterinary terms with multilingual definitions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Dictionary Term</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Term (English) *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter term in English" {...field} />
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
                      <FormLabel>Term (Kurdish)</FormLabel>
                      <FormControl>
                        <Input placeholder="زاراوە بە کوردی" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="arabic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Term (Arabic)</FormLabel>
                      <FormControl>
                        <Input placeholder="المصطلح بالعربية" {...field} />
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
                    <FormLabel>Definition/Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter comprehensive definition of the term"
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
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode/Reference ID</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Optional barcode or reference identifier"
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
                  onClick={() => form.reset()}
                >
                  Reset
                </Button>
                <Button type="submit" disabled={createWordMutation.isPending}>
                  {createWordMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Adding...
                    </>
                  ) : (
                    "Add Term"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
