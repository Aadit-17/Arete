import React from "react";

// ============ GlassCard ============
interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    accent?: 'cyan' | 'indigo' | 'violet';
    elevated?: boolean;
}

const getAccentGradient = (accent?: 'cyan' | 'indigo' | 'violet') => {
    switch (accent) {
        case 'cyan':
            return 'from-aura-accent/40 to-aura-accent/0';
        case 'indigo':
            return 'from-aura-indigo/40 to-aura-indigo/0';
        case 'violet':
            return 'from-aura-violet/40 to-aura-violet/0';
        default:
            return '';
    }
};

export const GlassCard = ({
    children,
    accent,
    elevated = false,
    className = "",
    ...props
}: GlassCardProps) => {
    const baseClass = elevated ? 'glass-panel-elevated' : 'glass-panel';
    const accentClass = accent ? `border-t-2 bg-gradient-to-br ${getAccentGradient(accent)}` : '';

    return (
        <div
            className={`${baseClass} p-6 ${accentClass} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

// ============ GlassButton ============
interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    variant?: 'ghost' | 'primary' | 'accent';
}

export const GlassButton = ({
    children,
    loading,
    variant = 'ghost',
    className = "",
    disabled,
    ...props
}: GlassButtonProps) => {
    const variantClass = variant === 'primary'
        ? 'aura-btn-primary'
        : variant === 'accent'
        ? 'bg-aura-accent text-black font-bold text-sm px-6 py-2.5 rounded-full hover:bg-aura-accent/90'
        : 'glass-button';

    return (
        <button
            className={`${variantClass} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {children}
        </button>
    );
};

// ============ GlassInput ============
interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    variant?: 'input' | 'textarea';
    rows?: number;
}

export const GlassInput = ({
    label,
    variant = 'input',
    className = "",
    ...props
}: GlassInputProps) => {
    if (variant === 'textarea') {
        const { rows = 4, ...textareaProps } = props as any;
        return (
            <div className="w-full space-y-2">
                {label && (
                    <label className="text-[12px] font-bold text-aura-secondary uppercase tracking-widest block">
                        {label}
                    </label>
                )}
                <textarea
                    className={`input-aura ${className}`}
                    rows={rows}
                    {...textareaProps}
                />
            </div>
        );
    }

    return (
        <div className="w-full space-y-2">
            {label && (
                <label className="text-[12px] font-bold text-aura-secondary uppercase tracking-widest block">
                    {label}
                </label>
            )}
            <input
                className={`input-aura ${className}`}
                {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
            />
        </div>
    );
};

// ============ GlassBadge ============
interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    children: React.ReactNode;
    color?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

const getBadgeColor = (color?: string) => {
    switch (color) {
        case 'success':
            return 'bg-green-500/20 text-zinc-100';
        case 'warning':
            return 'bg-yellow-500/20 text-zinc-100';
        case 'error':
            return 'bg-red-500/20 text-zinc-100';
        case 'info':
            return 'bg-blue-500/20 text-zinc-100';
        default:
            return 'bg-white/[0.08] text-zinc-100';
    }
};

export const GlassBadge = ({
    children,
    color = 'default',
    className = "",
    ...props
}: GlassBadgeProps) => (
    <span
        className={`glass-panel-sm inline-block px-3 py-1 text-[12px] font-bold uppercase tracking-widest ${getBadgeColor(color)} ${className}`}
        {...props}
    >
        {children}
    </span>
);

// ============ StatCard ============
interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
    label: string;
    value: string | number;
    unit: string;
    icon?: React.ElementType;
    accent?: string;
    valueColor?: string;
}

export const StatCard = ({
    label,
    value,
    unit,
    icon: Icon,
    accent,
    valueColor = "text-aura-accent",
    className = "",
    ...props
}: StatCardProps) => (
    <div
        className={`glass-panel p-4 flex flex-col items-center justify-center gap-2 group hover:bg-white/[0.05] transition-all ${className}`}
        {...props}
    >
        <div className="flex items-center gap-2 justify-center w-full">
            {Icon && <Icon size={16} className="text-zinc-400" />}
            <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
        </div>
        <div className={`text-2xl font-bold ${valueColor} tracking-tight`}>
            {value} <span className="text-sm text-zinc-400 font-normal">{unit}</span>
        </div>
    </div>
);

// ============ Legacy Exports (backward compatibility) ============
export const GlassPanel = ({ children, className = "", ...props }: any) => (
    <GlassCard className={className} {...props}>
        {children}
    </GlassCard>
);
