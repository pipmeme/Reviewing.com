import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

export const LoadingSpinner = ({ size = 'md', text, className }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center p-4", className)}>
      <div className="relative">
        <div className="absolute -inset-2 rounded-full blur-md bg-primary/20 animate-float" />
        <Loader2 className={`${sizeClasses[size]} animate-[spin_1.1s_cubic-bezier(0.4,0,0.2,1)_infinite] text-primary drop-shadow-[0_0_24px_hsl(var(--ring)_/_0.25)]`} />
      </div>
      {text && <p className="mt-3 text-sm text-muted-foreground">{text}</p>}
    </div>
  );
};

interface LoadingPageProps {
  text?: string;
}

export const LoadingPage = ({ text = "Loading..." }: LoadingPageProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <LoadingSpinner size="xl" text={text} />
    </div>
  );
};

interface LoadingOverlayProps {
  text?: string;
}

export const LoadingOverlay = ({ text }: LoadingOverlayProps) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card p-8 rounded-lg shadow-lg">
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  );
};
