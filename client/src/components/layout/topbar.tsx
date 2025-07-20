import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function TopBar() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-card shadow-sm border-b border-border">
      <div className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🐾</div>
          <h1 className="text-xl font-medium text-foreground">Veterinary Admin Panel</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Welcome, <span className="font-medium text-foreground">{user?.username}</span></span>
          </div>
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
