import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { diseaseSchema } from "@shared/schema";
import { api } from "@/lib/api";

export default function Diseases() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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

  const createDiseaseMutation = useMutation({
    mutationFn: api.diseases.create,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Disease has been added successfully",
      });
      form.reset();
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

  const onSubmit = (data: any) => {
    createDiseaseMutation.mutate(data);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Diseases Management</h2>
        <p className="text-gray-600">Add and manage disease information with multilingual support</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Disease</CardTitle>
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
                  onClick={() => form.reset()}
                >
                  Reset
                </Button>
                <Button type="submit" disabled={createDiseaseMutation.isPending}>
                  {createDiseaseMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Adding...
                    </>
                  ) : (
                    "Add Disease"
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
