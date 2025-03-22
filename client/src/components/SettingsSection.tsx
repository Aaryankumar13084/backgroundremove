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
    foregroundThreshold: 50,
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
        body: JSON.stringify(data),
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
              
              <Button 
                type="submit" 
                disabled={!form.formState.isDirty || mutation.isPending || isLoading}
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