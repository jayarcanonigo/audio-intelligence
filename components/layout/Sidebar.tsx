"use client";

import { useState } from "react";

const menus = [
  {
    name: "Dashboard",
    icon: "📊",
    href: "/",
  },
  {
    name: "Projects",
    icon: "📁",
    href: "/projects",
  },
  {
    name: "Ad Editor",
    icon: "🎧",
    href: "/ad-editor",
  },
  {
    name: "Reports",
    icon: "📑",
    href: "/reports",
  },
  {
    name: "Settings",
    icon: "⚙️",
    href: "/settings",
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`
        h-screen bg-gray-900 text-white transition-all duration-300
        ${collapsed ? "w-20" : "w-64"}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">

        {!collapsed && (
          <h1 className="font-bold text-lg">
            📻 Radio Search
          </h1>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded hover:bg-gray-700"
        >
          {collapsed ? "➡️" : "⬅️"}
        </button>

      </div>


      {/* Menu */}
      <nav className="mt-4">

        {menus.map((menu) => (
          <a
            key={menu.name}
            href={menu.href}
            className="
              flex items-center gap-3
              px-4 py-3
              hover:bg-gray-800
              transition
            "
          >

            <span className="text-xl">
              {menu.icon}
            </span>

            {!collapsed && (
              <span>
                {menu.name}
              </span>
            )}

          </a>
        ))}

      </nav>

    </aside>
  );
}