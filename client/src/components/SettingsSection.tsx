import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings, 
  settingsSchema, 
  BackgroundRemovalModel,
  BackgroundType,
  backgroundTypes
} from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, Settings2, Upload, Image, Palette } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface SettingsSectionProps {
  settings?: Settings;
  isLoading: boolean;
}

export default function SettingsSection({ settings, isLoading }: SettingsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const defaultSettings: Settings = {
    model: 'u2net',
    foregroundThreshold: 86,
    backgroundThreshold: 30,
    alphaMatting: false,
    backgroundType: 'transparent',
    backgroundColor: '#ffffff',
    backgroundImage: '',
    allowResize: true,
    allowMove: true,
    ...settings,
  };
  
  const form = useForm<Settings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaultSettings,
    values: settings,
  });
  
  const mutation = useMutation({
    mutationFn: async (data: Settings) => {
      await apiRequest({
        url: '/api/settings',
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': 'application/json',
        },
        on401: 'throw'
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: 'Settings saved',
        description: 'Your settings have been saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error saving settings',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (data: Settings) => {
    mutation.mutate(data);
  };
  
  const modelOptions = [
    { value: 'u2net', label: 'U2Net (Best Quality)' },
    { value: 'u2netp', label: 'U2Net-P (Faster)' },
    { value: 'u2net_human_seg', label: 'U2Net Human Seg (People Only)' },
  ];
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg shadow-sm">
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="flex w-full justify-between p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <span className="font-medium">Advanced Settings</span>
            </div>
            <ChevronDown 
              className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180 transform' : ''}`} 
            />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="p-4 pt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Background Removal Model</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-col space-y-1"
                      >
                        {modelOptions.map((option) => (
                          <FormItem 
                            key={option.value} 
                            className="flex items-center space-x-2 space-y-0"
                          >
                            <FormControl>
                              <RadioGroupItem 
                                value={option.value as BackgroundRemovalModel} 
                                id={option.value}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer" htmlFor={option.value}>
                              {option.label}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="foregroundThreshold"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <div className="flex justify-between">
                      <FormLabel>Foreground Threshold: {field.value}%</FormLabel>
                    </div>
                    <FormControl>
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[field.value]}
                        onValueChange={(values) => field.onChange(values[0])}
                      />
                    </FormControl>
                    <FormDescription>
                      Higher values keep only areas that are definitely foreground.
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="backgroundThreshold"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <div className="flex justify-between">
                      <FormLabel>Background Threshold: {field.value}%</FormLabel>
                    </div>
                    <FormControl>
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[field.value]}
                        onValueChange={(values) => field.onChange(values[0])}
                      />
                    </FormControl>
                    <FormDescription>
                      Higher values remove more of the background.
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="alphaMatting"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Alpha Matting</FormLabel>
                      <FormDescription>
                        Improves edge details but increases processing time.
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
              
              {/* Background Options */}
              <div className="space-y-4 border-t pt-4 mt-4">
                <h3 className="text-lg font-medium">Background Options</h3>
                
                <FormField
                  control={form.control}
                  name="backgroundType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Background Type</FormLabel>
                      <FormControl>
                        <Tabs 
                          value={field.value} 
                          onValueChange={field.onChange}
                          className="w-full"
                        >
                          <TabsList className="grid grid-cols-3 w-full">
                            <TabsTrigger value="transparent" className="flex items-center gap-2">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"/>
                              </svg>
                              Transparent
                            </TabsTrigger>
                            <TabsTrigger value="color" className="flex items-center gap-2">
                              <Palette size={16} />
                              Color
                            </TabsTrigger>
                            <TabsTrigger value="image" className="flex items-center gap-2">
                              <Image size={16} />
                              Image
                            </TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="transparent" className="p-4 rounded-md border mt-2">
                            <p className="text-sm text-gray-500">
                              The background will be transparent, allowing for overlay on any surface.
                            </p>
                          </TabsContent>
                          
                          <TabsContent value="color" className="p-4 rounded-md border mt-2">
                            <FormField
                              control={form.control}
                              name="backgroundColor"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Background Color</FormLabel>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-8 h-8 rounded-md border shadow-sm" 
                                      style={{ backgroundColor: field.value }}
                                    />
                                    <FormControl>
                                      <Input 
                                        type="color" 
                                        value={field.value}
                                        onChange={field.onChange}
                                      />
                                    </FormControl>
                                    <FormControl>
                                      <Input 
                                        placeholder="#FFFFFF" 
                                        value={field.value}
                                        onChange={field.onChange}
                                      />
                                    </FormControl>
                                  </div>
                                </FormItem>
                              )}
                            />
                          </TabsContent>
                          
                          <TabsContent value="image" className="p-4 rounded-md border mt-2">
                            <FormField
                              control={form.control}
                              name="backgroundImage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Background Image URL</FormLabel>
                                  <FormControl>
                                    <div className="grid gap-4">
                                      <Input 
                                        placeholder="https://example.com/image.jpg" 
                                        value={field.value || ''}
                                        onChange={field.onChange}
                                      />
                                      {field.value && (
                                        <div className="relative rounded-md overflow-hidden aspect-video">
                                          <img 
                                            src={field.value} 
                                            alt="Background preview" 
                                            className="object-cover w-full h-full"
                                            onError={() => {
                                              toast({
                                                title: "Image Error",
                                                description: "Could not load the background image",
                                                variant: "destructive"
                                              });
                                            }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </FormControl>
                                  <FormDescription>
                                    Enter the URL of an image to use as background
                                  </FormDescription>
                                </FormItem>
                              )}
                            />
                          </TabsContent>
                        </Tabs>
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {/* Image Manipulation Controls */}
                <div className="space-y-4">
                  <h4 className="font-medium">Image Manipulation</h4>
                  
                  <FormField
                    control={form.control}
                    name="allowResize"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Enable Image Resizing</FormLabel>
                          <FormDescription>
                            Allow resizing the processed image
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
                  
                  <FormField
                    control={form.control}
                    name="allowMove"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Enable Image Moving</FormLabel>
                          <FormDescription>
                            Allow moving the processed image
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
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={!form.formState.isDirty || mutation.isPending || isLoading}
                className="w-full mt-6"
              >
                {mutation.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </form>
          </Form>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}