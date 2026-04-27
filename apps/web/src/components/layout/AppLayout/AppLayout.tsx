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

  useEffect(() => {
    const title = ROUTE_TITLES[location.pathname] ?? "Dashboard";
    setPageHeader(title, undefined);
  }, [location.pathname, setPageHeader]);

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <TopBar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
