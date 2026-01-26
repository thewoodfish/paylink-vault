import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { DashboardSidebar } from './DashboardSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Get page title based on route
  const getPageTitle = () => {
    if (location.pathname === '/dashboard/paylinks/new') return 'Create PayLink';
    if (location.pathname.startsWith('/dashboard/paylinks/')) return 'PayLink Details';
    if (location.pathname === '/dashboard/paylinks') return 'PayLinks';
    if (location.pathname === '/dashboard/receipts') return 'Receipts';
    if (location.pathname === '/dashboard/settings') return 'Settings';
    return 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        showMenu 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      <DashboardSidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      <main className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-14 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
            
            <div className="flex items-center gap-3">
              {/* Search (hidden on mobile) */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search PayLinks..."
                  className="w-64 pl-9 bg-muted/50"
                />
              </div>

              {/* Create button */}
              {location.pathname !== '/dashboard/paylinks/new' && (
                <Button asChild className="glow-primary">
                  <Link to="/dashboard/paylinks/new">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Create PayLink</span>
                    <span className="sm:hidden">Create</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
