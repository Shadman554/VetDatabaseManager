import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { tutorialVideoSchema } from "@shared/schema";
import { api } from "@/lib/api";

export default function TutorialVideos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm({
    resolver: zodResolver(tutorialVideoSchema),
    defaultValues: {
      title: "",
      description: "",
      video_url: "",
      thumbnail_url: "",
      duration: "",
      category: "",
    },
  });

  const createVideoMutation = useMutation({
    mutationFn: (data) => {
      // Note: The API endpoint for tutorial videos is not in the provided docs
      // This is a placeholder - you may need to check the actual API endpoint
      return fetch('https://python-database-production.up.railway.app/api/tutorial-videos/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to create video');
        return res.json();
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Tutorial video has been added successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['tutorial-videos'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add tutorial video: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createVideoMutation.mutate(data);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Tutorial Videos Management</h2>
        <p className="text-gray-600">Add and manage educational video content</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Tutorial Video</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter tutorial video title" {...field} />
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
                        placeholder="Describe what the video covers"
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
                  name="video_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video URL *</FormLabel>
                      <FormControl>
                        <Input 
                          type="url"
                          placeholder="https://youtube.com/watch?v=..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="thumbnail_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail URL</FormLabel>
                      <FormControl>
                        <Input 
                          type="url"
                          placeholder="https://example.com/thumbnail.jpg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 15:30, 1h 30m" {...field} />
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
                          <SelectItem value="anatomy">Anatomy</SelectItem>
                          <SelectItem value="diagnostic">Diagnostic</SelectItem>
                          <SelectItem value="treatment">Treatment</SelectItem>
                          <SelectItem value="laboratory">Laboratory</SelectItem>
                          <SelectItem value="radiology">Radiology</SelectItem>
                          <SelectItem value="clinical-skills">Clinical Skills</SelectItem>
                        </SelectContent>
                      </Select>
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
                <Button type="submit" disabled={createVideoMutation.isPending}>
                  {createVideoMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Adding...
                    </>
                  ) : (
                    "Add Video"
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
