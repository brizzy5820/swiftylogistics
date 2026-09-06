import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, Mail, Building2, MapPin, Phone, Calendar, LogOut, Bell } from "lucide-react";
import { format } from "date-fns";

export default function AdminManageAccount() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Account Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your admin account information and preferences.
        </p>
      </div>

      {/* Account Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border bg-card">
          <CardHeader className="border-b border-border/50 pb-6">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Admin Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <div className="mt-2 rounded-lg border border-border/50 bg-secondary/30 px-4 py-3">
                  <p className="font-medium text-foreground">{user.name}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Role</label>
                <div className="mt-2 rounded-lg border border-border/50 bg-secondary/30 px-4 py-3">
                  <Badge className="bg-primary/20 text-primary capitalize">{user.role}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="mt-2 rounded-lg border border-border/50 bg-secondary/30 px-4 py-3">
                  <p className="text-sm text-foreground break-all">{user.email}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Department</label>
                <div className="mt-2 rounded-lg border border-border/50 bg-secondary/30 px-4 py-3">
                  <p className="font-medium text-foreground">{user.department || "—"}</p>
                </div>
              </div>
              {user.region && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Region</label>
                  <div className="mt-2 rounded-lg border border-border/50 bg-secondary/30 px-4 py-3">
                    <p className="font-medium text-foreground">{user.region}</p>
                  </div>
                </div>
              )}
              {user.company && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Company</label>
                  <div className="mt-2 rounded-lg border border-border/50 bg-secondary/30 px-4 py-3">
                    <p className="font-medium text-foreground">{user.company}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 rounded-lg border border-border/50 bg-secondary/30 p-4">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Account Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Account ID</span>
                  <p className="mt-1 font-mono text-foreground break-all">{user.id}</p>
                </div>
                {user.createdAt && (
                  <div>
                    <span className="text-muted-foreground">Member Since</span>
                    <p className="mt-1 font-medium text-foreground">
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border bg-card h-fit">
          <CardHeader className="border-b border-border/50 pb-6">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            <Button variant="outline" className="w-full justify-start border-border">
              <Shield className="mr-2 h-4 w-4" />
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start border-border">
              <Mail className="mr-2 h-4 w-4" />
              Update Email
            </Button>
            <Button variant="outline" className="w-full justify-start border-border">
              <Bell className="mr-2 h-4 w-4" />
              Notification Settings
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Account Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Account Status</p>
              <p className="mt-2 font-display font-bold text-foreground">Active</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <span className="h-2 w-2 rounded-full bg-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Last Login</p>
              <p className="mt-2 font-display font-bold text-foreground">Today</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-primary text-sm font-bold">✓</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Access Level</p>
              <p className="mt-2 font-display font-bold text-foreground">Admin</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground font-medium">2FA Status</p>
              <p className="mt-2 font-display font-bold text-foreground">Disabled</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <span className="text-orange-600 text-sm font-bold">!</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Section */}
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border/50 pb-6">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Security & Privacy
          </CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your security settings and privacy preferences
          </p>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-4">
            <div>
              <p className="font-medium text-foreground">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground mt-1">Add an extra layer of security to your account</p>
            </div>
            <Button variant="outline" size="sm">Enable</Button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-4">
            <div>
              <p className="font-medium text-foreground">Active Sessions</p>
              <p className="text-sm text-muted-foreground mt-1">View and manage your active sessions</p>
            </div>
            <Button variant="outline" size="sm">Manage</Button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-4">
            <div>
              <p className="font-medium text-foreground">Login Activity</p>
              <p className="text-sm text-muted-foreground mt-1">View your recent login history</p>
            </div>
            <Button variant="outline" size="sm">View</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
