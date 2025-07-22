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
  Info
} from "lucide-react";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, category: "Content Management" },
  { id: "books", label: "Books", icon: Book, category: "Content Management" },
  { id: "diseases", label: "Diseases", icon: Worm, category: "Content Management" },
  { id: "drugs", label: "Drugs", icon: Pill, category: "Content Management" },
  { id: "dictionary", label: "Dictionary", icon: BookOpen, category: "Content Management" },
  { id: "staff", label: "Staff", icon: UserRound, category: "Content Management" },
  { id: "normal-ranges", label: "Normal Ranges", icon: ChartBar, category: "Content Management" },
  { id: "tutorial-videos", label: "Tutorial Videos", icon: Video, category: "Content Management" },
  { id: "instruments", label: "Instruments", icon: Wrench, category: "Content Management" },
  { id: "notes", label: "Notes", icon: StickyNote, category: "Content Management" },
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

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-card shadow-lg border-r border-border">
      <nav className="mt-8">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="mb-8">
            <div className="px-4 mb-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {category}
              </h3>
            </div>
            
            <div className="space-y-1 px-2">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    className={cn(
                      "w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors",
                      activeSection === item.id
                        ? "text-primary bg-primary/10"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
