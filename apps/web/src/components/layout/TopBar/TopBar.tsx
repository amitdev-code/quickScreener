import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../features/auth/auth.store";
import { useLayoutStore } from "../layout.store";
import styles from "./TopBar.module.css";

export default function TopBar(): React.ReactElement {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { title, subtitle } = useLayoutStore();
  const collapsed = useLayoutStore((s) => s.sidebarCollapsed);

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  const topbarClass = `${styles.topbar}${collapsed ? ` ${styles.collapsed}` : ""}`;

  return (
    <header className={topbarClass}>
      {/* Left */}
      <div className={styles.left}>
        <button className={styles.backBtn} onClick={() => navigate(-1)} type="button" aria-label="Go back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className={styles.titleBlock}>
          <h1 className={styles.pageTitle}>{title}</h1>
          {subtitle && (
            <>
              <div className={styles.divider} />
              <span className={styles.pageSubtitle}>{subtitle}</span>
            </>
          )}
        </div>
      </div>

      {/* Right */}
      <div className={styles.right}>
        {/* Notification bell */}
        <button className={styles.notifBtn} type="button" aria-label="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <span className={styles.notifDot} />
        </button>

        {/* User chip */}
        <div className={styles.userChip}>
          <div className={styles.avatar}>
            {initials}
          </div>
          <span className={styles.userName}>{user?.full_name ?? "User"}</span>
        </div>
      </div>
    </header>
  );
}
