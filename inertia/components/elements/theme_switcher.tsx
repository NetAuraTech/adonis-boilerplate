import { useState, useEffect } from 'react'

interface ThemeSwitcherProps {
  initialTheme: 'light' | 'dark'
}

export function ThemeSwitcher(props: ThemeSwitcherProps) {
  const { initialTheme = 'light' } = props

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkbox = document.getElementById('theme-switcher') as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = isDark;
    }
  }, [isDark]);

  useEffect(() => {
    if (initialTheme) {
      setIsDark(initialTheme === 'dark');
    } else {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, [initialTheme])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      if (!initialTheme) {
        setIsDark(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [initialTheme]);

  const handleToggle = async () => {
    const newTheme = !isDark
    setIsDark(newTheme)

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    await fetch('/theme', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': csrfToken || '',
      },
      body: JSON.stringify({
        theme: newTheme ? 'dark' : 'light',
      }),
    })
  }

  return (
    <div className="flex align-items-center gap-3">
      <label htmlFor="theme-switcher" className="flex align-items-center cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            id="theme-switcher"
            className="sr-only"
            checked={isDark}
            onChange={handleToggle}
          />
          <div className="w-7 h-4 bg-neutral-200 border-1 border-solid border-neutral-300 border-radius-4 transition:color-300"></div>
          <div
            className={`absolute w-3 h-3 bg-neutral-100 border-radius-4 transition:left-300 flex align-items-center justify-content-center `}
            style={{ top: '0.25rem', left:  isDark ? '1.75rem' : '0.25rem' }}
          >
            {isDark ? (
              <svg className="w-2 h-2 clr-neutral-800" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            ) : (
              <svg className="w-2 h-2 clr-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
      </label>
    </div>
  );
}
