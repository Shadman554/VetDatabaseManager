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
import Notes from "@/pages/notes";
import UrineSlides from "@/pages/urine-slides";
import Notifications from "@/pages/notifications";
import AppLinks from "@/pages/app-links";
import About from "@/pages/about";
import NotFound from "@/pages/not-found";
import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
        return <Notes />;
      case "urine-slides":
        return <UrineSlides />;
      case "notifications":
        return <Notifications />;
      case "app-links":
        return <AppLinks />;
      case "about":
        return <About />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <div className="flex">
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
        <main className="flex-1">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <MainApp />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
