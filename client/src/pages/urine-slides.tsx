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
import { urineSlideSchema } from "@shared/schema";
import { api } from "@/lib/api";

export default function UrineSlides() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm({
    resolver: zodResolver(urineSlideSchema),
    defaultValues: {
      name: "",
      description: "",
      findings: "",
      image_url: "",
    },
  });

  const createSlideMutation = useMutation({
    mutationFn: api.urineSlides.create,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Urine slide has been added successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['urine-slides'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add urine slide: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createSlideMutation.mutate(data);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Urine Slides Management</h2>
        <p className="text-gray-600">Add and manage urine microscopy slide images and findings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Urine Slide</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slide Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Normal Urine, Bacterial Infection, Crystals" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the urine sample and case background"
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
                name="findings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Microscopic Findings</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed microscopic findings: cells, crystals, bacteria, casts, etc."
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
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input 
                        type="url"
                        placeholder="https://example.com/slide-image.jpg"
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
                <Button type="submit" disabled={createSlideMutation.isPending}>
                  {createSlideMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Adding...
                    </>
                  ) : (
                    "Add Slide"
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
