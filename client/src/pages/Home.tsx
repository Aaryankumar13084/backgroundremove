import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import UploadSection from "@/components/UploadSection";
import SettingsSection from "@/components/SettingsSection";
import FaqSection from "@/components/FaqSection";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "@shared/schema";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"upload" | "settings">("upload");
  const { toast } = useToast();
  
  // Fetch settings
  const { data: settings, error, isLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });
  
  if (error) {
    toast({
      title: "Error fetching settings",
      description: "Failed to load application settings.",
      variant: "destructive",
    });
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
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
              <a href="https://github.com/nadermx/backgroundremover" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700 ml-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="pb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-textColor mb-2">Remove Image Background</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Automatically remove backgrounds from your images in seconds using AI technology.
            100% free, no sign-up required.
          </p>
        </div>

        {/* App Container */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px px-6 pt-4" aria-label="Tabs">
              <button 
                className={`px-3 py-2 font-medium text-sm ${
                  activeTab === "upload" 
                    ? "text-primary border-primary rounded-t-lg border-b-2 border-l border-r border-t" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("upload")}
              >
                Upload
              </button>
              <button 
                className={`px-3 py-2 font-medium text-sm ml-2 ${
                  activeTab === "settings" 
                    ? "text-primary border-primary rounded-t-lg border-b-2 border-l border-r border-t" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("settings")}
              >
                Settings
              </button>
            </nav>
          </div>

          {/* Content Sections */}
          <div className={activeTab === "upload" ? "block" : "hidden"}>
            <UploadSection settings={settings} isLoading={isLoading} />
          </div>
          <div className={activeTab === "settings" ? "block" : "hidden"}>
            <SettingsSection settings={settings} isLoading={isLoading} />
          </div>
        </div>

        {/* FAQ Section */}
        <FaqSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
