import { useMemo } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Shield, Truck, BarChart3, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useListUsers } from "@workspace/api-client-react";

export default function LoginPage() {
  const { loginAs } = useAuth();
  const { data: users = [] } = useListUsers();
  const [, setLocation] = useLocation();

  const adminAccounts = useMemo(
    () => users.filter((user) => user.role === "admin"),
    [users],
  );

  const handleLogin = (email: string) => {
    loginAs(email);
    setLocation("/admin");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground">Logistics Admin Portal</h1>
          </div>
          <p className="text-muted-foreground">Complete command center for logistics operations, shipments, and customer management</p>
        </div>

        {/* Feature highlights */}
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: Truck, label: "Real-time Tracking", desc: "Monitor all shipments live" },
            { icon: BarChart3, label: "Analytics Dashboard", desc: "Key performance metrics" },
            { icon: Clock, label: "Operations Control", desc: "Manage all logistics" },
          ].map((feature, i) => (
            <div key={i} className="rounded-lg border border-border/50 bg-card/50 p-4 text-center">
              <feature.icon className="mx-auto mb-2 h-5 w-5 text-primary" />
              <p className="text-sm font-medium">{feature.label}</p>
            </div>
          ))}
        </div>

        {/* Admin accounts */}
        <Card className="border-border bg-card shadow-lg">
          <CardHeader className="border-b border-border/50 pb-6">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-5 w-5 text-primary" />
              Select Admin Account
            </CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">Choose your admin credentials to access the control center</p>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {adminAccounts.length === 0 ? (
              <div className="py-12 text-center">
                <Shield className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-muted-foreground">No admin accounts available</p>
              </div>
            ) : (
              adminAccounts.map((account) => (
                <div
                  key={account.id}
                  className="group rounded-lg border border-border/50 bg-background/50 p-5 transition-all duration-200 hover:border-primary/50 hover:bg-primary/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                          {account.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{account.name}</p>
                          <p className="text-sm text-muted-foreground">{account.email}</p>
                        </div>
                      </div>
                      {account.department && (
                        <p className="mt-3 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Department:</span> {account.department}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary capitalize shrink-0">
                      {account.role}
                    </Badge>
                  </div>
                  <Button
                    onClick={() => handleLogin(account.email)}
                    className="mt-5 w-full justify-between bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Access Control Center
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Footer note */}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Xenith Logistics Admin Portal · For authorized personnel only
        </p>
      </div>
    </div>
  );
}
