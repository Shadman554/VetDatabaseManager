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
import { drugSchema } from "@shared/schema";
import { api } from "@/lib/api";

export default function Drugs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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

  const createDrugMutation = useMutation({
    mutationFn: api.drugs.create,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Drug has been added successfully",
      });
      form.reset();
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

  const onSubmit = (data: any) => {
    createDrugMutation.mutate(data);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Drugs Management</h2>
        <p className="text-gray-600">Add and manage pharmaceutical information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Drug</CardTitle>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  onClick={() => form.reset()}
                >
                  Reset
                </Button>
                <Button type="submit" disabled={createDrugMutation.isPending}>
                  {createDrugMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Adding...
                    </>
                  ) : (
                    "Add Drug"
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
