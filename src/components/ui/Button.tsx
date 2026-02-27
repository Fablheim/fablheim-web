import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'lg';
}

const variantClasses = {
  primary:
    'bg-primary text-primary-foreground btn-emboss border border-[hsla(38,60%,60%,0.15)] hover:bg-primary/90 hover:shadow-[0_0_20px_hsla(38,90%,50%,0.3)]',
  secondary:
    'bg-secondary text-secondary-foreground btn-emboss border border-secondary/30 hover:bg-secondary/80',
  destructive:
    'bg-destructive text-destructive-foreground btn-emboss border border-destructive/40 hover:bg-destructive/90',
  ghost:
    'text-muted-foreground hover:bg-accent/60 hover:text-foreground hover:shadow-[inset_0_0_15px_hsla(38,60%,50%,0.05)]',
  outline:
    'border border-border bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground hover:border-gold hover:shadow-[0_0_12px_hsla(38,80%,50%,0.1)]',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  default: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({ children, variant = 'primary', size = 'default', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-[calc(var(--mkt-radius)-0.2rem)] font-[Cinzel] font-medium tracking-wider uppercase text-[0.8em] shadow-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mkt-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
