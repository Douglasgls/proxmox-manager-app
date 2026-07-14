import React from 'react';
import { cn } from '@/lib/utils';
import { AVAILABLE_COMPONENTS } from '../constants';
import { Globe, GitBranch, Shield, Check } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe,
  GitBranch,
  Shield,
};

interface ComponentSelectorProps {
  selected: string[];
  onChange: (components: string[]) => void;
}

export const ComponentSelector: React.FC<ComponentSelectorProps> = ({
  selected,
  onChange,
}) => {
  const toggleComponent = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((c) => c !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {AVAILABLE_COMPONENTS.map((component) => {
        const isSelected = selected.includes(component.id);
        const Icon = iconMap[component.icon] || Globe;

        return (
          <button
            key={component.id}
            type="button"
            onClick={() => toggleComponent(component.id)}
            className={cn(
              'relative flex flex-col items-center gap-2.5 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer group text-left',
              isSelected
                ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm shadow-primary/10'
                : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'
            )}
          >
            {/* Check indicator */}
            <div
              className={cn(
                'absolute top-2 right-2 size-5 rounded-full flex items-center justify-center transition-all duration-200',
                isSelected
                  ? 'bg-primary text-primary-foreground scale-100'
                  : 'bg-muted border border-border scale-90 opacity-50'
              )}
            >
              {isSelected && <Check className="size-3" strokeWidth={3} />}
            </div>

            {/* Icon */}
            <div
              className={cn(
                'size-10 rounded-lg flex items-center justify-center transition-colors duration-200',
                isSelected
                  ? 'bg-primary/10 text-primary dark:bg-primary/20'
                  : 'bg-muted text-muted-foreground group-hover:text-foreground'
              )}
            >
              <Icon className="size-5" />
            </div>

            {/* Name & description */}
            <div className="text-center">
              <span
                className={cn(
                  'text-sm font-semibold block transition-colors duration-200',
                  isSelected ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                )}
              >
                {component.name}
              </span>
              <span className="text-[11px] text-muted-foreground leading-tight mt-0.5 block">
                {component.description}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
