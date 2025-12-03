/// <reference types="vite/client" />

declare module 'lucide-react' {
  import * as React from 'react';
  
  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
  }
  
  export type LucideIcon = React.ForwardRefExoticComponent<
    LucideProps & React.RefAttributes<SVGSVGElement>
  >;
  
  // Iconos utilizados en el proyecto
  export const Droplets: LucideIcon;
  export const Thermometer: LucideIcon;
  export const Sun: LucideIcon;
  export const CloudRain: LucideIcon;
  export const Activity: LucideIcon;
  export const Zap: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const MoreVertical: LucideIcon;
  export const Plus: LucideIcon;
  export const Trash2: LucideIcon;
  export const Wifi: LucideIcon;
  export const WifiOff: LucideIcon;
  export const User: LucideIcon;
  export const Mail: LucideIcon;
  export const Lock: LucideIcon;
  export const Save: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const Check: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const Cloud: LucideIcon;
  export const Moon: LucideIcon;
  export const Bell: LucideIcon;
  export const Menu: LucideIcon;
  export const X: LucideIcon;
  export const LogOut: LucideIcon;
  export const Settings: LucideIcon;
  export const Home: LucideIcon;
  export const Clock: LucideIcon;
  export const Cpu: LucideIcon;
  export const Filter: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const Timer: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const Loader2: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const Leaf: LucideIcon;
  export const Flower2: LucideIcon;
}
