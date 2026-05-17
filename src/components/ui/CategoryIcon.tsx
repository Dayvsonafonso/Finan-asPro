import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  color?: string;
}

export function CategoryIcon({ name, className, color }: CategoryIconProps) {
  const Icon = (Icons as any)[name] as LucideIcon;
  
  if (!Icon) {
    return <Icons.HelpCircle className={className} style={{ color }} />;
  }

  return <Icon className={className} style={{ color }} />;
}
