import { PaletteIcon } from "lucide-react";
import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";

function ThemeSelector() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="dropdown dropdown-end">
      <button tabIndex={0} className="btn btn-ghost btn-sm gap-2 rounded-full px-3">
        <PaletteIcon className="size-4" />
        <span className="hidden text-sm font-medium sm:inline">Theme</span>
      </button>

      <div
        tabIndex={0}
        className="dropdown-content mt-2 w-56 rounded-2xl border border-base-content/10 bg-base-200/80 p-2 shadow-2xl backdrop-blur-xl"
      >
        {THEMES.map((themeOption) => (
          <button
            key={themeOption.name}
            className={`w-full rounded-xl px-4 py-3 text-left transition-colors ${
              theme === themeOption.name
                ? "bg-primary/10 text-primary"
                : "hover:bg-base-content/5"
            }`}
            onClick={() => setTheme(themeOption.name)}
          >
            <div className="flex items-center gap-3">
              <PaletteIcon className="size-4" />
              <div>
                <p className="text-sm font-medium">{themeOption.label}</p>
                <div className="mt-1 flex gap-1">
                  {themeOption.colors.map((color, index) => (
                    <span key={index} className="size-2 rounded-full" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ThemeSelector;
