interface DividerProps {
  diamond?: boolean;
  className?: string;
}

export default function Divider({ diamond = false, className = "" }: DividerProps) {
  if (diamond) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="flex-1 h-px bg-gold opacity-30" />
        <span className="text-gold text-xs opacity-60 select-none">◆</span>
        <div className="flex-1 h-px bg-gold opacity-30" />
      </div>
    );
  }

  return <div className={`h-px bg-gold opacity-30 ${className}`} />;
}
