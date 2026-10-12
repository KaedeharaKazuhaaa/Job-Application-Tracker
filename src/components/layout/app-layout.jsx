import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Header from "./header";
import SideNav from "./sidenav";
import ConfirmDialog from "../ui/confirm-dialog";
import { useToast } from "../ui/toast-context";
import "./app-layout.css";

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isLogoutConfirmationOpen, setIsLogoutConfirmationOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAccount() {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          const error = new Error(result.error || "Unable to verify your session.");
          error.status = response.status;
          throw error;
        }
        if (isMounted) setUser(result.user);
      } catch (error) {
        if (!isMounted) return;
        if (error.status === 401) {
          toast("Your session ended. Please sign in again.", "error");
          navigate("/login", { replace: true });
        } else if (isMounted) {
          toast(error.message, "error");
          navigate("/login", { replace: true });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAccount();
    return () => {
      isMounted = false;
    };
  }, [navigate, toast]);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to sign out.");
      toast("You have been signed out.", "logout");
    } catch (error) {
      toast(error.message || "Unable to sign out.", "error");
    } finally {
      setIsLoggingOut(false);
      setIsLogoutConfirmationOpen(false);
      navigate("/login", { replace: true });
    }
  }

  if (isLoading) {
    return <main className="app-layout-loading" role="status">Loading your workspace...</main>;
  }
  if (!user) return null;

  return (
    <div className="app-layout-shell">
      {isNavOpen && (
        <button
          className="app-layout-backdrop"
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsNavOpen(false)}
        />
      )}
      <SideNav
        isOpen={isNavOpen}
        activePath={location.pathname}
        onClose={() => setIsNavOpen(false)}
      />
      <div className="app-layout-main">
        <Header
          email={user.email}
          onMenuClick={() => setIsNavOpen(true)}
          onLogout={() => setIsLogoutConfirmationOpen(true)}
        />
        <Outlet context={{ user }} />
      </div>
      {isLogoutConfirmationOpen && (
        <ConfirmDialog
          title="Sign out?"
          description="You will need to sign in again to access your job search workspace."
          confirmLabel="Sign out"
          variant="neutral"
          isConfirming={isLoggingOut}
          onCancel={() => setIsLogoutConfirmationOpen(false)}
          onConfirm={handleLogout}
        />
      )}
    </div>
  );
}

export default AppLayout;
