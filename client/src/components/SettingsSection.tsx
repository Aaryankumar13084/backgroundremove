import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings, settingsSchema, backgroundRemovalModels } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SettingsSectionProps {
  settings?: Settings;
  isLoading: boolean;
}

export default function SettingsSection({ settings, isLoading }: SettingsSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Default settings if not yet loaded
  const defaultSettings: Settings = {
    model: "u2net",
    alphaMatting: false,
    foregroundThreshold: 50,
    backgroundThreshold: 50,
  };
  
  const form = useForm<Settings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings || defaultSettings,
    values: settings,
  });
  
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Settings) => {
      const response = await apiRequest("POST", "/api/settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Settings failed to save",
        description: error instanceof Error ? error.message : "An error occurred when saving settings",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: Settings) => {
    updateSettingsMutation.mutate(data);
  };
  
  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Background Removal Settings</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* AI Model Selection */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-base font-medium text-gray-900">AI Model Selection</h3>
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem className="mt-4 space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          className="flex flex-col space-y-3"
                        >
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="u2net" id="model-u2net" />
                            <FormLabel htmlFor="model-u2net" className="font-normal">
                              U2Net (Default) - Best overall performance
                            </FormLabel>
                          </div>
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="u2netp" id="model-u2netp" />
                            <FormLabel htmlFor="model-u2netp" className="font-normal">
                              U2Net-p - Faster but less accurate
                            </FormLabel>
                          </div>
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="u2net_human_seg" id="model-u2net_human_seg" />
                            <FormLabel htmlFor="model-u2net_human_seg" className="font-normal">
                              U2Net Human Segmentation - Optimized for humans
                            </FormLabel>
                          </div>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Processing Options */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-base font-medium text-gray-900">Processing Options</h3>
                <div className="mt-4 space-y-4">
                  {/* Alpha Matting */}
                  <FormField
                    control={form.control}
                    name="alphaMatting"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel className="font-medium">Alpha Matting</FormLabel>
                          <FormDescription className="text-sm text-gray-500">
                            Better edge detection for complex images (slower)
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {/* Foreground Threshold */}
                  <FormField
                    control={form.control}
                    name="foregroundThreshold"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel className="font-medium">Foreground Threshold</FormLabel>
                          <FormDescription className="text-sm text-gray-500">
                            Sensitivity for foreground detection
                          </FormDescription>
                        </div>
                        <FormControl className="w-32">
                          <Slider
                            min={0}
                            max={100}
                            step={1}
                            value={[field.value]}
                            onValueChange={(vals) => field.onChange(vals[0])}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {/* Background Threshold */}
                  <FormField
                    control={form.control}
                    name="backgroundThreshold"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel className="font-medium">Background Threshold</FormLabel>
                          <FormDescription className="text-sm text-gray-500">
                            Sensitivity for background detection
                          </FormDescription>
                        </div>
                        <FormControl className="w-32">
                          <Slider
                            min={0}
                            max={100}
                            step={1}
                            value={[field.value]}
                            onValueChange={(vals) => field.onChange(vals[0])}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            
            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={updateSettingsMutation.isPending}
                className="inline-flex items-center px-4 py-2"
              >
                {updateSettingsMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Settings
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
