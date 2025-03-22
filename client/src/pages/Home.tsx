import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import UploadSection from "@/components/UploadSection";
import SettingsSection from "@/components/SettingsSection";
import ResultSection from "@/components/ResultSection";
import FaqSection from "@/components/FaqSection";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "@shared/schema";
import { loadModel } from "@/lib/backgroundRemover";

// Define the interface for image result data
interface ImageResult {
  original: string;
  processed: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"upload" | "settings">("upload");
  const [result, setResult] = useState<ImageResult | null>(null);
  const { toast } = useToast();
  
  // Fetch settings
  const { data: settings, error, isLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });
  
  // Preload TensorFlow model
  useEffect(() => {
    loadModel().catch(error => {
      console.error("Failed to load TensorFlow model:", error);
      toast({
        title: "Model loading error",
        description: "Failed to load the AI model. Please try again or check your connection.",
        variant: "destructive",
      });
    });
  }, []);
  
  if (error) {
    toast({
      title: "Error fetching settings",
      description: "Failed to load application settings.",
      variant: "destructive",
    });
  }
  
  // Callback when image is processed successfully
  const handleUploadSuccess = (data: ImageResult) => {
    setResult(data);
  };
  
  // Reset the process to upload a new image
  const handleReset = () => {
    setResult(null);
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="bg-white shadow-sm dark:bg-gray-950 dark:border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a href="/" className="text-primary font-bold text-xl flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M5 8h14M5 12h14M5 16h9" />
                </svg>
                <span>Background Remover</span>
              </a>
            </div>
            <div className="flex items-center">
              <a href="https://github.com/nadermx/backgroundremover" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 ml-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Hero Section - Show only when no result is displayed */}
        {!result && (
          <div className="pb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-textColor mb-2">Remove Image Background</h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Automatically remove backgrounds from your images in seconds using AI technology.
              100% free, no sign-up required.
            </p>
          </div>
        )}

        {/* Result Section - Show when an image has been processed */}
        {result && (
          <ResultSection 
            originalImage={result.original} 
            processedImage={result.processed} 
            onReset={handleReset} 
          />
        )}

        {/* App Container - Show only when no result is displayed */}
        {!result && (
          <div className="bg-white dark:bg-gray-950 rounded-xl shadow-md overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-800">
              <nav className="flex -mb-px px-6 pt-4" aria-label="Tabs">
                <button 
                  className={`px-3 py-2 font-medium text-sm ${
                    activeTab === "upload" 
                      ? "text-primary border-primary rounded-t-lg border-b-2 border-l border-r border-t" 
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setActiveTab("upload")}
                >
                  Upload
                </button>
                <button 
                  className={`px-3 py-2 font-medium text-sm ml-2 ${
                    activeTab === "settings" 
                      ? "text-primary border-primary rounded-t-lg border-b-2 border-l border-r border-t" 
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setActiveTab("settings")}
                >
                  Settings
                </button>
              </nav>
            </div>

            {/* Content Sections */}
            <div className={activeTab === "upload" ? "block" : "hidden"}>
              <UploadSection 
                settings={settings} 
                isLoading={isLoading} 
                onUploadSuccess={handleUploadSuccess}
              />
            </div>
            <div className={activeTab === "settings" ? "block" : "hidden"}>
              <SettingsSection settings={settings} isLoading={isLoading} />
            </div>
          </div>
        )}

        {/* FAQ Section - Show only when no result is displayed */}
        {!result && <FaqSection />}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
