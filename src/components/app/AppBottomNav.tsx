import { Link, useLocation } from "@tanstack/react-router";
import { menuItems } from "@/lib/app-shell-utils";

export function AppBottomNav() {
  const location = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] flex items-center justify-around px-1 z-40"
      role="navigation"
      aria-label="Navegação rápida"
    >
      {menuItems.map((item) => {
        const isActive = location.pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all relative ${
              isActive ? "text-primary font-semibold" : "text-slate-400 hover:text-slate-600"
            }`}
            style={{ minWidth: "44px", minHeight: "44px" }}
          >
            {/* Highlight bar above active item */}
            {isActive && (
              <div className="absolute top-0 left-1/4 right-1/4 h-0.75 bg-primary rounded-full" />
            )}
            <item.icon
              className={`h-5 w-5 mb-0.5 transition-transform duration-200 ${
                isActive ? "text-primary scale-110" : "text-slate-400"
              }`}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span className="text-[9px] tracking-tight truncate max-w-full font-medium">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
