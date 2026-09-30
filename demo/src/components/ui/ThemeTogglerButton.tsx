import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { Button } from './Button';
import { cn } from '../../lib/utils';

export interface ThemeTogglerButtonProps extends React.ComponentProps<typeof Button> {
  direction?: 'btt' | 'ttb' | 'ltr' | 'rtl';
}

export const ThemeTogglerButton = React.forwardRef<HTMLButtonElement, ThemeTogglerButtonProps>(
  ({ className, direction = 'btt', ...props }, ref) => {
    const { theme, toggleTheme } = useTheme();

    return (
      <Button
        ref={ref}
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        className={cn("relative overflow-hidden w-9 h-9 p-0 rounded-full", className)}
        {...props}
      >
        <motion.div
          initial={false}
          animate={{
            scale: theme === 'light' ? 1 : 0,
            y: theme === 'light' ? 0 : (direction === 'btt' ? 25 : -25),
            opacity: theme === 'light' ? 1 : 0,
            rotate: theme === 'light' ? 0 : 90
          }}
          transition={{ duration: 0.4, ease: "backOut" }}
          className="absolute inset-0 flex items-center justify-center text-gray-700"
        >
          <Moon size={18} />
        </motion.div>

        <motion.div
          initial={false}
          animate={{
            scale: theme === 'dark' ? 1 : 0,
            y: theme === 'dark' ? 0 : (direction === 'btt' ? -25 : 25),
            opacity: theme === 'dark' ? 1 : 0,
            rotate: theme === 'dark' ? 0 : -90
          }}
          transition={{ duration: 0.4, ease: "backOut" }}
          className="absolute inset-0 flex items-center justify-center text-gray-200"
        >
          <Sun size={18} />
        </motion.div>
      </Button>
    );
  }
);

ThemeTogglerButton.displayName = 'ThemeTogglerButton';
