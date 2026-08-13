import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import { LoadingPanel } from "./components/StateViews";
import { useAuthStore } from "./store/auth";

const Login = lazy(() => import("./pages/Login"));
const Landing = lazy(() => import("./pages/Landing"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Complaints = lazy(() => import("./pages/Complaints"));
const Bills = lazy(() => import("./pages/Bills"));
const Visitors = lazy(() => import("./pages/Visitors"));
const Notices = lazy(() => import("./pages/Notices"));
const Residents = lazy(() => import("./pages/Residents"));
const AI = lazy(() => import("./pages/AI"));
const Admin = lazy(() => import("./pages/Admin"));
const Committee = lazy(() => import("./pages/Committee"));

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.accessToken);
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

function RequireRole({ role, children }: { role: "admin" | "committee"; children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const roles = user?.roles.map((item) => item.name) ?? [];
  const allowed = role === "admin"
    ? Boolean(user?.is_superuser || roles.includes("admin"))
    : Boolean(user?.is_superuser || roles.includes("admin") || roles.includes("committee"));
  return allowed ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return <Suspense fallback={<LoadingPanel />}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route path="home" element={<Dashboard />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="bills" element={<Bills />} />
        <Route path="visitors" element={<Visitors />} />
        <Route path="notices" element={<Notices />} />
        <Route path="residents" element={<Residents />} />
        <Route path="ai" element={<AI />} />
        <Route path="admin" element={<RequireRole role="admin"><Admin /></RequireRole>} />
        <Route path="committee" element={<RequireRole role="committee"><Committee /></RequireRole>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>;
}
