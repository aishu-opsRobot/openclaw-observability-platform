import { useTheme } from "../context/ThemeContext.jsx";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <label className="flex items-center gap-2">
      <span className="hidden text-xs text-gray-500 dark:text-gray-400 sm:inline">主题</span>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white py-1.5 pl-2 pr-8 text-xs font-medium text-gray-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 sm:text-sm"
        aria-label="主题"
      >
        <option value="light">浅色</option>
        <option value="dark">深色</option>
        <option value="system">跟随系统</option>
      </select>
    </label>
  );
}
