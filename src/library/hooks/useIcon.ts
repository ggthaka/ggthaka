import { useModeContext, useThemeContext } from '@library/hooks';

type Icon = 'light' | 'dark';

export default function useIcon() {
  const { theme } = useThemeContext();
  const { mode } = useModeContext();
  const directIcon = theme === 'system' ? mode : theme;
  const icon: Icon = directIcon === 'dark' ? 'light' : 'dark';

  return { icon };
}
