import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, Worm, Pill, BookOpen } from "lucide-react";
import { api } from "@/lib/api";

export default function Dashboard() {
  const { data: booksData } = useQuery({
    queryKey: ['dashboard-books'],
    queryFn: () => api.books.getAll({ limit: 1 }),
  });

  const { data: diseasesData } = useQuery({
    queryKey: ['dashboard-diseases'],
    queryFn: () => api.diseases.getAll({ limit: 1 }),
  });

  const { data: drugsData } = useQuery({
    queryKey: ['dashboard-drugs'],
    queryFn: () => api.drugs.getAll({ limit: 1 }),
  });

  const { data: dictionaryData } = useQuery({
    queryKey: ['dashboard-dictionary'],
    queryFn: () => api.dictionary.getAll({ limit: 1 }),
  });

  const stats = [
    {
      title: "Total Books",
      value: booksData?.total || 0,
      icon: Book,
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    },
    {
      title: "Diseases Documented", 
      value: diseasesData?.total || 0,
      icon: Worm,
      color: "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    },
    {
      title: "Drug Database",
      value: drugsData?.total || 0,
      icon: Pill,
      color: "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    },
    {
      title: "Dictionary Terms",
      value: dictionaryData?.total || 0,
      icon: BookOpen,
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">Dashboard</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Overview of your veterinary educational platform content</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{stat.title}</p>
                    <p className="text-2xl sm:text-3xl font-semibold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`rounded-full p-2 sm:p-3 ${stat.color}`}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start space-x-3 sm:space-x-4 py-2 sm:py-3 border-b border-border">
              <div className="bg-blue-100 dark:bg-blue-900/20 rounded-full p-2 flex-shrink-0 mt-0.5">
                <Book className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">System ready for content management</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Use the sidebar to navigate to different content types</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 sm:space-x-4 py-2 sm:py-3 border-b border-border">
              <div className="bg-green-100 dark:bg-green-900/20 rounded-full p-2 flex-shrink-0 mt-0.5">
                <Worm className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">API connection established</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Connected to veterinary educational platform</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 sm:space-x-4 py-2 sm:py-3">
              <div className="bg-orange-100 dark:bg-orange-900/20 rounded-full p-2 flex-shrink-0 mt-0.5">
                <Pill className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Admin panel initialized</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Ready to add and manage content</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
