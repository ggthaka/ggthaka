'use client';

import { Icon, IconProps } from '@components/shared';
import { useTrigger } from '@library/hooks';
import { DropdownStyles } from '@styles/shared';
import { ReactNode, useEffect } from 'react';

interface Props {
  title: string;
  icon?: IconProps;
  children?: ReactNode;
  active?: boolean;
}

export default function Dropdown({ title, icon, children, active }: Props) {
  const { trigger, pullTrigger, setTrigger } = useTrigger();

  useEffect(() => {
    if (active) setTrigger(true);
  }, [active, setTrigger]);

  return (
    <div className={DropdownStyles.Dropdown}>
      <div
        className={DropdownStyles.Head}
        onClick={pullTrigger}
      >
        {icon && (
          <div
            className={
              active ? DropdownStyles.IconWrapper : DropdownStyles.IconWrapper2
            }
          >
            <Icon
              name={icon.name}
              alt={icon.alt}
              size={16}
              inverted={active && true}
              custom={icon.custom}
              className={
                active ? DropdownStyles.PActive : DropdownStyles.PInactive
              }
            />
          </div>
        )}
        <p
          style={{ fontWeight: active ? '700' : '' }}
          className={active ? '' : DropdownStyles.PInactive}
        >
          {title}
        </p>
        <div className={DropdownStyles.IconContainer}>
          <Icon
            name='chevron'
            alt='Chevron Icon'
            size={10}
            className={
              trigger ? DropdownStyles.Icon : DropdownStyles.IconDefault
            }
          />
        </div>
      </div>
      {trigger && <div className={DropdownStyles.Body}>{children}</div>}
    </div>
  );
}
