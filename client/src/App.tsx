import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { TopBar } from "@/components/layout/topbar";
import { Sidebar } from "@/components/layout/sidebar";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Books from "@/pages/books";
import Diseases from "@/pages/diseases";
import Drugs from "@/pages/drugs";
import Dictionary from "@/pages/dictionary";
import Staff from "@/pages/staff";
import NormalRanges from "@/pages/normal-ranges";
import TutorialVideos from "@/pages/tutorial-videos";
import Instruments from "@/pages/instruments";
import NotesSimple from "@/pages/notes-simple";
import UrineSlides from "@/pages/urine-slides";
import OtherSlides from "@/pages/other-slides";
import StoolSlides from "@/pages/stool-slides";
import Notifications from "@/pages/notifications";
import AppLinks from "@/pages/app-links";
import About from "@/pages/about";
import BulkUpload from "@/pages/bulk-upload";
import ExportData from "@/pages/export-data";
import NotFound from "@/pages/not-found";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ThemeProvider } from "@/components/theme-provider";
import { useIsMobile } from "@/hooks/use-mobile";

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard />;
      case "books":
        return <Books />;
      case "diseases":
        return <Diseases />;
      case "drugs":
        return <Drugs />;
      case "dictionary":
        return <Dictionary />;
      case "staff":
        return <Staff />;
      case "normal-ranges":
        return <NormalRanges />;
      case "tutorial-videos":
        return <TutorialVideos />;
      case "instruments":
        return <Instruments />;
      case "notes":
        return <NotesSimple />;
      case "urine-slides":
        return <UrineSlides />;
      case "other-slides":
        return <OtherSlides />;
      case "stool-slides":
        return <StoolSlides />;
      case "notifications":
        return <Notifications />;
      case "app-links":
        return <AppLinks />;
      case "about":
        return <About />;
      case "bulk-upload":
        return <BulkUpload />;
      case "export-data":
        return <ExportData />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
      />
      <div className="flex">
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={(section) => {
            setActiveSection(section);
            if (isMobile) {
              setSidebarOpen(false);
            }
          }}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isMobile={isMobile}
        />
        <main className="flex-1 min-w-0">
          <div className="p-2 sm:p-4 lg:p-6">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vet-admin-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <MainApp />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
