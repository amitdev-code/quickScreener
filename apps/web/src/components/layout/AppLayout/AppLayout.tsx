import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../Sidebar";
import TopBar from "../TopBar";
import { useLayoutStore } from "../layout.store";
import styles from "./AppLayout.module.css";

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/interview": "Interview",
  "/insight": "Insight",
  "/talent": "Talent",
  "/faq": "FAQ",
  "/settings": "Settings",
};

export default function AppLayout(): React.ReactElement {
  const location = useLocation();
  const setPageHeader = useLayoutStore((s) => s.setPageHeader);
  const collapsed = useLayoutStore((s) => s.sidebarCollapsed);

  useEffect(() => {
    const title = ROUTE_TITLES[location.pathname] ?? "Dashboard";
    setPageHeader(title, undefined);
  }, [location.pathname, setPageHeader]);

  const mainClass = `${styles.main}${collapsed ? ` ${styles.collapsed}` : ""}`;

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={mainClass}>
        <TopBar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
