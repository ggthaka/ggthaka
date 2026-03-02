'use client';

import { Icon } from '@components/shared';
import { useModeContext, useThemeContext } from '@library/hooks';
import { ThemeStyles } from '@styles/shared';

export default function Theme() {
  const { theme, triggerTheme } = useThemeContext();
  const { mode } = useModeContext();

  return (
    <div
      className={ThemeStyles.Theme}
      onClick={triggerTheme}
    >
      <div className={ThemeStyles.Head}>
        <Icon
          inverted
          name={
            theme === 'dark' ? 'moon' : theme === 'light' ? 'sun' : 'system'
          }
          alt=''
          size={16}
        />
      </div>
      <div className={ThemeStyles.Body}>
        <p>{theme}</p>
        <span>
          <span>{mode}</span> Mode
        </span>
      </div>
    </div>
  );
}
