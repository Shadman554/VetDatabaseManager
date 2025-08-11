import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Book, 
  Worm, 
  Pill, 
  BookOpen, 
  UserRound, 
  ChartBar, 
  Video,
  Wrench,
  StickyNote,
  Microscope,
  Bell,
  Link,
  Info,
  Upload,
  Download,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
  isMobile?: boolean;
}

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, category: "Content Management" },
  { id: "bulk-upload", label: "Bulk Upload", icon: Upload, category: "Content Management" },
  { id: "export-data", label: "Export Data", icon: Download, category: "System" },
  { id: "import-data", label: "Import Data", icon: Upload, category: "System" },
  { id: "books", label: "Books", icon: Book, category: "Content Management" },
  { id: "diseases", label: "Diseases", icon: Worm, category: "Content Management" },
  { id: "drugs", label: "Drugs", icon: Pill, category: "Content Management" },
  { id: "dictionary", label: "Dictionary", icon: BookOpen, category: "Content Management" },
  { id: "staff", label: "Staff", icon: UserRound, category: "Content Management" },
  { id: "normal-ranges", label: "Normal Ranges", icon: ChartBar, category: "Content Management" },
  { id: "tutorial-videos", label: "Tutorial Videos", icon: Video, category: "Content Management" },
  { id: "instruments", label: "Instruments", icon: Wrench, category: "Content Management" },
  { id: "notes", label: "Notes", icon: StickyNote, category: "Content Management" },
  { id: "haematology-tests", label: "Haematology Tests", icon: Microscope, category: "Laboratory Tests" },
  { id: "serology-tests", label: "Serology Tests", icon: Microscope, category: "Laboratory Tests" },
  { id: "biochemistry-tests", label: "Biochemistry Tests", icon: Microscope, category: "Laboratory Tests" },
  { id: "bacteriology-tests", label: "Bacteriology Tests", icon: Microscope, category: "Laboratory Tests" },
  { id: "other-tests", label: "Other Tests", icon: Microscope, category: "Laboratory Tests" },
  { id: "urine-slides", label: "Urine Slides", icon: Microscope, category: "Laboratory" },
  { id: "other-slides", label: "Other Slides", icon: Microscope, category: "Laboratory" },
  { id: "stool-slides", label: "Stool Slides", icon: Microscope, category: "Laboratory" },
  { id: "notifications", label: "Notifications", icon: Bell, category: "System" },
  { id: "app-links", label: "App Links", icon: Link, category: "System" },
  { id: "about", label: "About", icon: Info, category: "System" },
];

const groupedItems = navigationItems.reduce((acc, item) => {
  if (!acc[item.category]) {
    acc[item.category] = [];
  }
  acc[item.category].push(item);
  return acc;
}, {} as Record<string, typeof navigationItems>);

export function Sidebar({ activeSection, onSectionChange, sidebarOpen = false, setSidebarOpen, isMobile }: SidebarProps) {
  const navigationContent = (
    <nav className="mt-6 px-2">
      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category} className="mb-6">
          <div className="px-3 mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {category}
            </h3>
          </div>
          
          <div className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    "w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                    activeSection === item.id
                      ? "text-primary bg-primary/10 border-r-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  if (isMobile) {
    return (
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="px-4 py-6 border-b">
            <SheetTitle className="flex items-center space-x-2">
              <div className="text-xl">🐾</div>
              <span>Navigation</span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            {navigationContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="hidden lg:flex w-64 bg-card shadow-lg border-r border-border flex-col">
      <div className="flex-1 overflow-y-auto">
        {navigationContent}
      </div>
    </aside>
  );
}
