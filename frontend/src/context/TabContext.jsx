import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getTabTitle } from "@/config/tabTitles";
import TabWarningModal from "@/components/layout/TabWarningModal";

const TabContext = createContext(null);

const STORAGE_KEY_TABS = "pfs_open_tabs_v2";
const STORAGE_KEY_ACTIVE = "pfs_active_tab_v2";

const DEFAULT_HOME_TAB = {
  id: "/",
  path: "/",
  title: "داشبورد اصلی",
  isPinned: true,
};

export function TabProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Load initial tabs from sessionStorage or default
  const [tabs, setTabs] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_TABS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.error("Error loading tabs from sessionStorage:", err);
    }
    return [DEFAULT_HOME_TAB];
  });

  const [activeTabId, setActiveTabId] = useState(() => {
    try {
      const savedActive = sessionStorage.getItem(STORAGE_KEY_ACTIVE);
      if (savedActive) return savedActive;
    } catch (e) {}
    return location.pathname || "/";
  });

  // State for 10-tab warning modal
  const [pendingTab, setPendingTab] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Reference to current active tab path to safely revert on cancel
  const currentActivePathRef = useRef(activeTabId);

  useEffect(() => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (activeTab) {
      currentActivePathRef.current = activeTab.path;
    }
  }, [activeTabId, tabs]);

  // Persist to sessionStorage on state changes
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY_TABS, JSON.stringify(tabs));
      sessionStorage.setItem(STORAGE_KEY_ACTIVE, activeTabId);
    } catch (e) {}
  }, [tabs, activeTabId]);

  // Intercept location changes
  useEffect(() => {
    const currentPath = location.pathname;

    // Check if tab already exists
    const existingTab = tabs.find((t) => t.path === currentPath);

    if (existingTab) {
      setActiveTabId(existingTab.id);
    } else {
      // Create new tab candidate
      const title = getTabTitle(currentPath);
      const newTabCandidate = {
        id: currentPath,
        path: currentPath,
        title: title,
      };

      // If user reaches 10 or more open tabs, trigger warning modal!
      if (tabs.length >= 10) {
        setPendingTab(newTabCandidate);
        setShowWarningModal(true);
      } else {
        // Automatically add tab when under limit
        setTabs((prev) => [...prev, newTabCandidate]);
        setActiveTabId(newTabCandidate.id);
      }
    }
  }, [location.pathname]);

  // Confirm adding new tab (when >= 10 tabs)
  const confirmOpenTab = () => {
    if (pendingTab) {
      setTabs((prev) => {
        if (prev.some((t) => t.id === pendingTab.id)) return prev;
        return [...prev, pendingTab];
      });
      setActiveTabId(pendingTab.id);
      setPendingTab(null);
    }
    setShowWarningModal(false);
  };

  // Cancel adding new tab -> revert route back to active tab
  const cancelOpenTab = () => {
    const fallbackPath = currentActivePathRef.current || "/";
    if (location.pathname !== fallbackPath) {
      navigate(fallbackPath, { replace: true });
    }
    setPendingTab(null);
    setShowWarningModal(false);
  };

  // Switch to a tab
  const activateTab = (tabId) => {
    const target = tabs.find((t) => t.id === tabId);
    if (target) {
      setActiveTabId(target.id);
      if (location.pathname !== target.path) {
        navigate(target.path);
      }
    }
  };

  // Close a specific tab
  const closeTab = (tabId, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    setTabs((prevTabs) => {
      const targetIndex = prevTabs.findIndex((t) => t.id === tabId);
      if (targetIndex === -1) return prevTabs;

      const newTabs = prevTabs.filter((t) => t.id !== tabId);

      // If all tabs were closed, fallback to Home tab
      if (newTabs.length === 0) {
        const homeTab = DEFAULT_HOME_TAB;
        setActiveTabId(homeTab.id);
        navigate(homeTab.path);
        return [homeTab];
      }

      // If the closed tab was currently active, switch to neighboring tab
      if (tabId === activeTabId) {
        const nextIndex = targetIndex >= newTabs.length ? newTabs.length - 1 : targetIndex;
        const nextTab = newTabs[nextIndex];
        setActiveTabId(nextTab.id);
        navigate(nextTab.path);
      }

      return newTabs;
    });
  };

  // Close all tabs except home
  const closeAllTabs = () => {
    const homeTab = tabs.find((t) => t.path === "/") || DEFAULT_HOME_TAB;
    setTabs([homeTab]);
    setActiveTabId(homeTab.id);
    navigate(homeTab.path);
  };

  // Close all tabs except specified tabId
  const closeOtherTabs = (tabId) => {
    const targetTab = tabs.find((t) => t.id === tabId);
    if (!targetTab) return;
    setTabs([targetTab]);
    setActiveTabId(targetTab.id);
    navigate(targetTab.path);
  };

  return (
    <TabContext.Provider
      value={{
        tabs,
        activeTabId,
        activateTab,
        closeTab,
        closeAllTabs,
        closeOtherTabs,
      }}
    >
      {children}
      <TabWarningModal
        open={showWarningModal}
        pendingTab={pendingTab}
        tabCount={tabs.length}
        onConfirm={confirmOpenTab}
        onCancel={cancelOpenTab}
      />
    </TabContext.Provider>
  );
}

export function useTabs() {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error("useTabs must be used within a TabProvider");
  }
  return context;
}
