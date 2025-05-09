
import type { FC } from 'react';
import { AppLogo } from './AppLogo';

export const Header: FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <AppLogo />
      </div>
    </header>
  );
};
