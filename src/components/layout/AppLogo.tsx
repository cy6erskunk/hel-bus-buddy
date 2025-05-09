
import { Bus } from 'lucide-react';
import type { FC } from 'react';

export const AppLogo: FC = () => {
  return (
    <div className="flex items-center gap-2">
      <Bus className="h-8 w-8 text-primary" />
      <span className="text-xl font-semibold tracking-tight">Helsinki Bus Buddy</span>
    </div>
  );
};
