import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, User, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface TopBarProps {
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
  isMobile?: boolean;
}

export function TopBar({ sidebarOpen, setSidebarOpen, isMobile }: TopBarProps) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-card shadow-sm border-b border-border sticky top-0 z-40">
      <div className="px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2 sm:space-x-3">
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen?.(!sidebarOpen)}
              className="p-2 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="text-lg sm:text-2xl">🐾</div>
          <h1 className="text-sm sm:text-xl font-medium text-foreground truncate">
            <span className="hidden sm:inline">Veterinary Admin Panel</span>
            <span className="sm:hidden">Vet Admin</span>
          </h1>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Welcome, <span className="font-medium text-foreground">{user?.username}</span></span>
          </div>
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={logout} className="p-2">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
