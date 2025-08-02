import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { insertNotificationSchema, type Notification } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Bell, CheckCircle, Trash2, Eye, PlusCircle, AlertCircle, MessageSquare } from "lucide-react";
import { format } from "date-fns";

export default function Notifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  
  const form = useForm({
    resolver: zodResolver(insertNotificationSchema),
    defaultValues: {
      title: "",
      content: "",
      type: "general" as const,
      is_read: false,
    },
  });

  // Fetch all notifications
  const { data: notificationsResponse, isLoading } = useQuery({
    queryKey: ['/api/notifications'],
  });

  // Fetch recent notifications (for stats only)
  const { data: recentNotificationsResponse } = useQuery({
    queryKey: ['/api/notifications/recent/latest'],
  });

  // Use all notifications from the main endpoint
  const notifications = (notificationsResponse as any)?.items || [];
  const allNotifications = (notificationsResponse as any)?.items || [];
  const recentNotifications = (recentNotificationsResponse as any)?.notifications || [];

  const createNotificationMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/notifications/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notification created successfully",
      });
      form.reset();
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/recent/latest'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create notification: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/notifications/${id}/read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notification marked as read",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/recent/latest'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => fetch('/api/notifications/mark-all-read', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/recent/latest'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/notifications/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notification deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const onSubmit = (data: any) => {
    createNotificationMutation.mutate(data);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'drug': return '💊';
      case 'disease': return '🦠';
      case 'quiz': return '📝';
      case 'update': return '🔄';
      case 'reminder': return '⏰';
      default: return '📢';
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'drug': return 'outline';
      case 'disease': return 'destructive';
      case 'quiz': return 'secondary';
      case 'update': return 'default';
      case 'reminder': return 'secondary';
      default: return 'default';
    }
  };

  const unreadCount = Array.isArray(recentNotifications) ? recentNotifications.length : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Notification System</h2>
          <p className="text-muted-foreground">Manage notifications for the veterinary mobile app</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending || unreadCount === 0}
            variant="outline"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark All Read ({unreadCount})
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Send Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Send New Notification to Mobile App</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title (عنوان ئاگادارکردنەوە) *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., بەخکراوەکان بە VET DICT+" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content (ناوەڕۆک) *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="ناوەڕۆکی ئاگادارکردنەوە بە کوردی یان ئینگلیزی..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type (جۆر)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select notification type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="general">📢 General (گشتی)</SelectItem>
                            <SelectItem value="drug">💊 Drug (دەرمان)</SelectItem>
                            <SelectItem value="disease">🦠 Disease (نەخۆشی)</SelectItem>
                            <SelectItem value="quiz">📝 Quiz (تاقیکردنەوە)</SelectItem>
                            <SelectItem value="update">🔄 Update (نوێکردنەوە)</SelectItem>
                            <SelectItem value="reminder">⏰ Reminder (بیرخستنەوە)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        form.reset();
                        setIsCreateDialogOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createNotificationMutation.isPending}>
                      {createNotificationMutation.isPending ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Sending...
                        </>
                      ) : (
                        "Send Notification"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Notifications</p>
                <p className="text-2xl font-bold">{(notificationsResponse as any)?.total || allNotifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Recent Notifications</p>
                <p className="text-2xl font-bold">{Array.isArray(recentNotifications) ? recentNotifications.length : 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Testing Instructions */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Testing your notifications:</strong> After sending notifications, check the Flutter app. Look for "Successfully loaded X notifications" in console logs. The notification icon should show unread count badge.
        </AlertDescription>
      </Alert>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            All Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : !Array.isArray(allNotifications) || allNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No notifications found. Create your first notification above.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(allNotifications) && allNotifications.map((notification: any) => (
                    <TableRow key={notification.id} className={!notification.is_read ? "bg-blue-50 dark:bg-blue-950/20" : ""}>
                      <TableCell>
                        {notification.is_read ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          📢 General
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{notification.title}</TableCell>
                      <TableCell className="max-w-md truncate">{notification.body}</TableCell>
                      <TableCell>
                        {notification.timestamp ? format(new Date(notification.timestamp), 'MMM dd, yyyy HH:mm') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedNotification(notification)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Notification Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Title:</label>
                                  <p className="text-sm text-muted-foreground">{notification.title}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Content:</label>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notification.content}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Type:</label>
                                  <p className="text-sm text-muted-foreground">{notification.type || 'general'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Status:</label>
                                  <p className="text-sm text-muted-foreground">{notification.is_read ? 'Read' : 'Unread'}</p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsReadMutation.mutate(notification.id!)}
                              disabled={markAsReadMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotificationMutation.mutate(notification.id!)}
                            disabled={deleteNotificationMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
