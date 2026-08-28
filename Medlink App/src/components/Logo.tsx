import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export default function Logo({ className, size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  return (
    <div className={cn("flex flex-row items-center gap-2.5 whitespace-nowrap shrink-0", className)}>
      <div className={cn("relative flex items-center justify-center overflow-hidden rounded-xl shrink-0", sizeClasses[size])}>
        {/* Using the uploaded photo as the logo */}
        <img 
          src="/logo.png" 
          alt="MedLink Logo"
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Fallback to text if image fails to load
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
      {showText && (
        <span className={cn(
          "font-black tracking-tighter text-[#145c94] font-sans italic whitespace-nowrap shrink-0 leading-none select-none",
          textSizeClasses[size]
        )}>
          Med<span className="text-blue-500">Link</span>
        </span>
      )}
    </div>
  );
}

