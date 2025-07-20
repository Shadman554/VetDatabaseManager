import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { bookSchema } from "@shared/schema";
import { api } from "@/lib/api";

export default function Books() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      cover_url: "",
      download_url: "",
    },
  });

  const createBookMutation = useMutation({
    mutationFn: api.books.create,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Book has been added successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add book: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createBookMutation.mutate(data);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Books Management</h2>
        <p className="text-gray-600">Add and manage educational books for the platform</p>
      </div>

      <Tabs defaultValue="add" className="space-y-6">
        <TabsList>
          <TabsTrigger value="add">Add New Book</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
        </TabsList>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Add New Book</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter book title" {...field} />
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="surgery">Surgery</SelectItem>
                              <SelectItem value="medicine">Internal Medicine</SelectItem>
                              <SelectItem value="anatomy">Anatomy</SelectItem>
                              <SelectItem value="pharmacology">Pharmacology</SelectItem>
                              <SelectItem value="pathology">Pathology</SelectItem>
                              <SelectItem value="radiology">Radiology</SelectItem>
                            </SelectContent>
                          </Select>
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
                            placeholder="Enter book description"
                            rows={4}
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
                      name="cover_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cover Image URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://example.com/cover.jpg"
                              type="url"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="download_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Download URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://example.com/book.pdf"
                              type="url"
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
                      onClick={() => form.reset()}
                    >
                      Reset
                    </Button>
                    <Button type="submit" disabled={createBookMutation.isPending}>
                      {createBookMutation.isPending ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Adding...
                        </>
                      ) : (
                        "Add Book"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Import Books</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Bulk Import Coming Soon</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload CSV or Excel files to import multiple books at once
                </p>
                <div className="bg-blue-50 rounded-md p-4 text-left">
                  <div className="flex">
                    <div className="text-blue-400 mr-3">ℹ️</div>
                    <div className="text-sm text-blue-700">
                      <p className="font-medium mb-1">CSV Format Guidelines:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Required columns: title, description, category</li>
                        <li>Optional columns: cover_url, download_url</li>
                        <li>Maximum file size: 10MB</li>
                        <li>Supported formats: CSV, XLSX, XLS</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
