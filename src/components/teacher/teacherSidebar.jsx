import { useState } from "react";
import {
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import {
  teacherBottomSidebarItems,
  teacherSidebarItems,
} from "./teacherConfig";
import logo from "../../assets/ejist-primary-logo.png";

export default function TeacherSidebar({
  activeView,
  mobileOpen,
  onClose,
  onSelectView,
  onLogout,
}) {
  const [collapsed, setCollapsed] =
    useState(false);

  function handleSelectView(view) {
    onSelectView?.(view);
    onClose?.();
  }

  function handleLogout() {
    onClose?.();
    onLogout?.();
  }

  function toggleSidebar() {
    setCollapsed((current) => !current);
  }

  function navigationButtonClass(active) {
    return `group flex w-full items-center rounded-xl py-2.5 text-left text-sm font-medium transition-all duration-200 ${collapsed
        ? "gap-3 px-3 lg:justify-center lg:gap-0 lg:px-2"
        : "gap-3 px-3"
      } ${active
        ? "bg-white text-blue-700 shadow-sm"
        : "text-blue-100 hover:bg-white/10 hover:text-white"
      }`;
  }

  function iconClass(active) {
    return `h-[18px] w-[18px] shrink-0 transition-colors ${active
        ? "text-blue-600"
        : "text-blue-200 group-hover:text-white"
      }`;
  }

  function NavigationItems({ items }) {
    return items.map(
      ({
        key,
        icon: Icon,
        label,
      }) => {
        const active =
          activeView === key;

        return (
          <button
            type="button"
            key={key}
            title={
              collapsed
                ? label
                : undefined
            }
            onClick={() =>
              handleSelectView(key)
            }
            aria-current={
              active
                ? "page"
                : undefined
            }
            aria-label={label}
            className={navigationButtonClass(
              active,
            )}
          >
            <Icon
              className={iconClass(active)}
            />

            <span
              className={`truncate ${collapsed
                  ? "lg:hidden"
                  : ""
                }`}
            >
              {label}
            </span>

            {active && !collapsed && (
              <span
                aria-hidden="true"
                className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600"
              />
            )}
          </button>
        );
      },
    );
  }

  return (
    <>
      {/* Mobile background overlay */}
      <div
        className={`fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-[1px] transition-opacity duration-300 ease-in-out lg:hidden ${mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
          }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sidebar"
          className="h-full w-full"
        />
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 h-dvh w-60 shrink-0 overflow-visible bg-gradient-to-b from-blue-700 via-blue-700 to-blue-900 text-white shadow-xl transition-[width,transform] duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 lg:shadow-none ${collapsed
            ? "lg:w-20"
            : "lg:w-60"
          } ${mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
          }`}
      >
        {/* Desktop middle collapse button */}
        <button
          type="button"
          onClick={toggleSidebar}
          title={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          aria-label={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          className="absolute right-0 top-1/2 z-50 hidden h-9 w-9 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-gray-50 bg-white text-blue-700 shadow-md transition-all duration-200 hover:scale-110 hover:bg-blue-50 hover:text-blue-800 lg:flex"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>

        <div className="flex h-full min-h-full flex-col overflow-y-auto">
          {/* Logo and title */}
          <div
            className={`sticky top-0 z-10 flex h-16 shrink-0 items-center border-b border-white/10 bg-blue-700/95 backdrop-blur transition-all duration-300 ${collapsed
                ? "gap-2 px-4 lg:justify-center lg:px-2"
                : "gap-3 px-4"
              }`}
          >
            <button
              type="button"
              onClick={() =>
                handleSelectView("dashboard")
              }
              title="Go to dashboard"
              aria-label="Go to teacher dashboard"
              className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-sm transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              <img
                src={logo}
                alt="EJIST school logo"
                draggable="false"
                className="h-full w-full select-none object-contain"
              />
            </button>
            <span
              className={`truncate text-lg font-bold tracking-tight ${collapsed
                  ? "lg:hidden"
                  : ""
                }`}
            >
              ELP-AMP Teacher
            </span>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sidebar"
              className="ml-auto rounded-lg p-1.5 text-blue-100 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Main navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            <p
              className={`mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200 ${collapsed
                  ? "lg:hidden"
                  : ""
                }`}
            >
              Main Menu
            </p>

            <NavigationItems
              items={teacherSidebarItems}
            />
          </nav>

          {/* Account navigation */}
          <div className="shrink-0 border-t border-white/10 bg-blue-900/30 px-3 py-3">
            <p
              className={`mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200 ${collapsed
                  ? "lg:hidden"
                  : ""
                }`}
            >
              Account
            </p>

            <div className="space-y-1">
              <NavigationItems
                items={
                  teacherBottomSidebarItems
                }
              />

              <button
                type="button"
                onClick={handleLogout}
                title={
                  collapsed
                    ? "Log out"
                    : undefined
                }
                aria-label="Log out"
                className={`group flex w-full items-center rounded-xl py-2.5 text-left text-sm font-medium text-red-100 transition-all duration-200 hover:bg-red-500/20 hover:text-white ${collapsed
                    ? "gap-3 px-3 lg:justify-center lg:gap-0 lg:px-2"
                    : "gap-3 px-3"
                  }`}
              >
                <LogOut className="h-[18px] w-[18px] shrink-0 text-red-200 transition-colors group-hover:text-white" />

                <span
                  className={`truncate ${collapsed
                      ? "lg:hidden"
                      : ""
                    }`}
                >
                  Log out
                </span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}