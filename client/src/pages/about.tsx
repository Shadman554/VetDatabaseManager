import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { aboutSchema } from "@shared/schema";
import { api } from "@/lib/api";
import { useEffect } from "react";

export default function About() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm({
    resolver: zodResolver(aboutSchema),
    defaultValues: {
      title: "",
      content: "",
      version: "",
    },
  });

  // Fetch existing about data
  const { data: aboutData, isLoading: isLoadingAbout } = useQuery({
    queryKey: ['about'],
    queryFn: api.about.get,
  });

  // Update form when data is loaded
  useEffect(() => {
    if (aboutData) {
      form.reset({
        title: aboutData.title || "",
        content: aboutData.content || "",
        version: aboutData.version || "",
      });
    }
  }, [aboutData, form]);

  const saveAboutMutation = useMutation({
    mutationFn: (data: any) => {
      // Check if about data exists, update if it does, create if it doesn't
      return aboutData ? api.about.update(data) : api.about.create(data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "About information has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['about'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save about information: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    saveAboutMutation.mutate(data);
  };

  if (isLoadingAbout) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground mb-2">About Page Management</h2>
        <p className="text-muted-foreground">Manage the about page content for the application</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About Information</CardTitle>
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
                      <FormLabel>Page Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., About Veterinary Educational Platform" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2.0.0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About Content *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter the about page content, mission, features, contact information, etc."
                        rows={12}
                        className="min-h-[300px]"
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
                <Button type="submit" disabled={saveAboutMutation.isPending}>
                  {saveAboutMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    aboutData ? "Update About" : "Create About"
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
