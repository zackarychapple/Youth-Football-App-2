# Component Specifications - CFL Game Tracker MVP

## Design System Foundation

### Color Palette

#### Game State Colors
```css
/* Offensive States */
--offense-primary: #10B981;     /* Emerald 500 - Active offense */
--offense-secondary: #34D399;   /* Emerald 400 - Offense highlights */
--offense-muted: #D1FAE5;       /* Emerald 100 - Offense background */

/* Defensive States */
--defense-primary: #EF4444;     /* Red 500 - Active defense */
--defense-secondary: #F87171;   /* Red 400 - Defense highlights */
--defense-muted: #FEE2E2;       /* Red 100 - Defense background */

/* Special Teams */
--special-primary: #F59E0B;     /* Amber 500 - Special teams active */
--special-secondary: #FBBF24;   /* Amber 400 - Special highlights */
--special-muted: #FEF3C7;       /* Amber 100 - Special background */

/* Core UI Colors */
--neutral-900: #111827;         /* Primary text */
--neutral-700: #374151;         /* Secondary text */
--neutral-500: #6B7280;         /* Muted text */
--neutral-300: #D1D5DB;         /* Borders */
--neutral-100: #F3F4F6;         /* Backgrounds */
--neutral-50: #F9FAFB;          /* Light backgrounds */

/* Status Colors */
--success: #10B981;             /* Success states */
--warning: #F59E0B;             /* Warning states */
--error: #EF4444;               /* Error states */
--info: #3B82F6;                /* Info states */

/* High Contrast Mode */
--hc-background: #000000;       /* Pure black background */
--hc-foreground: #FFFFFF;       /* Pure white text */
--hc-accent: #FFFF00;          /* Yellow for focus indicators */
```

### Typography Scale

```css
/* Optimized for outdoor readability */
--font-family: system-ui, -apple-system, "SF Pro Display", "Segoe UI", sans-serif;
--font-mono: "SF Mono", "Roboto Mono", monospace;

/* Mobile-first scale with enhanced readability */
--text-xs: 0.75rem;     /* 12px - Metadata only */
--text-sm: 0.875rem;    /* 14px - Secondary labels */
--text-base: 1rem;      /* 16px - Body text minimum */
--text-lg: 1.125rem;    /* 18px - Primary content */
--text-xl: 1.25rem;     /* 20px - Section headers */
--text-2xl: 1.5rem;     /* 24px - Page titles */
--text-3xl: 1.875rem;   /* 30px - Major numbers */
--text-4xl: 2.25rem;    /* 36px - Score displays */
--text-5xl: 3rem;       /* 48px - Game clock */

/* Font weights for clarity */
--font-normal: 400;     /* Body text */
--font-medium: 500;     /* Emphasis */
--font-semibold: 600;   /* Headers */
--font-bold: 700;       /* Critical actions */
--font-black: 900;      /* Scores */

/* Line heights for touch targets */
--leading-none: 1;
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;  /* Touch-friendly spacing */
```

### Touch Target Specifications

```typescript
// Minimum touch target sizes
const TOUCH_TARGETS = {
  minimum: 44,      // iOS HIG minimum
  preferred: 48,    // Our standard
  large: 56,        // Primary actions
  xlarge: 64,       // Game-critical actions
} as const;

// Touch target spacing
const TOUCH_SPACING = {
  minimum: 8,       // Between adjacent targets
  comfortable: 12,  // Standard spacing
  generous: 16,     // Prevents mis-taps
} as const;
```

### Spacing System

```css
/* One-handed use optimization - thumb-reachable zones */
--space-0: 0;
--space-1: 0.25rem;   /* 4px - Tight grouping */
--space-2: 0.5rem;    /* 8px - Minimum touch spacing */
--space-3: 0.75rem;   /* 12px - Standard element spacing */
--space-4: 1rem;      /* 16px - Section padding */
--space-5: 1.25rem;   /* 20px - Group separation */
--space-6: 1.5rem;    /* 24px - Card padding */
--space-8: 2rem;      /* 32px - Major sections */
--space-10: 2.5rem;   /* 40px - Page margins */
--space-12: 3rem;     /* 48px - Bottom nav clearance */
--space-16: 4rem;     /* 64px - FAB clearance */

/* Safe zones for one-handed use */
--safe-top: env(safe-area-inset-top);
--safe-bottom: env(safe-area-inset-bottom);
--safe-left: env(safe-area-inset-left);
--safe-right: env(safe-area-inset-right);

/* Thumb-reachable zone (bottom 60% of screen) */
--thumb-zone-start: 40vh;
--thumb-zone-end: 100vh;
```

## Component Architecture

### Atomic Design Structure

```
/src/components/
├── atoms/              # Basic building blocks
│   ├── Button/
│   ├── Input/
│   ├── Badge/
│   ├── Icon/
│   └── TouchTarget/
├── molecules/          # Combinations of atoms
│   ├── FormField/
│   ├── PlayerCard/
│   ├── StatDisplay/
│   ├── SyncIndicator/
│   └── GameTimer/
├── organisms/          # Complex UI components
│   ├── TeamRoster/
│   ├── AuthForm/
│   ├── PlaySelector/
│   ├── ScoreBoard/
│   └── NavigationBar/
├── templates/          # Page layouts
│   ├── AppShell/
│   ├── GameLayout/
│   ├── FormLayout/
│   └── ListLayout/
└── providers/          # Context providers
    ├── ThemeProvider/
    ├── OfflineProvider/
    └── GestureProvider/
```

### shadcn/ui Component Selections

```typescript
// Core shadcn/ui components to install and customize
const SHADCN_COMPONENTS = [
  'button',       // Customized for 48px minimum height
  'input',        // Enhanced for touch with 56px height
  'select',       // Native select for mobile optimization
  'dialog',       // Full-screen modals on mobile
  'sheet',        // Slide-out panels for navigation
  'tabs',         // Game state switcher (offense/defense)
  'badge',        // Player status indicators
  'toast',        // Sync notifications
  'alert',        // Offline warnings
  'form',         // React Hook Form integration
  'switch',       // Toggle switches for settings
  'radio-group',  // Quick selection options
] as const;

// Custom theme overrides
const customTheme = {
  radius: {
    DEFAULT: '0.75rem',  // Larger radius for touch-friendly design
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    full: '9999px',
  },
  // All interactive elements get minimum 48px height
  components: {
    button: {
      height: 'min-h-[48px]',
      padding: 'px-6',
      fontSize: 'text-lg',
    },
    input: {
      height: 'h-14',  // 56px for easy thumb typing
      fontSize: 'text-lg',
      padding: 'px-4',
    },
  },
};
```

### Gesture Handling Patterns

```typescript
// Gesture configuration using @use-gesture/react
interface GestureConfig {
  swipe: {
    threshold: 50,        // Minimum swipe distance
    velocity: 0.3,        // Minimum swipe velocity
    direction: 'horizontal' | 'vertical' | 'both';
  };
  tap: {
    threshold: 10,        // Maximum movement for tap
    interval: 300,        // Double-tap window
  };
  longPress: {
    threshold: 500,       // Hold duration for long press
    tolerance: 10,        // Movement tolerance during hold
  };
}

// Common gesture patterns
const GESTURE_PATTERNS = {
  // Swipe to delete/edit player
  playerSwipe: {
    left: 'delete',
    right: 'edit',
  },
  // Pull to refresh roster
  pullToRefresh: {
    threshold: 100,
    resistance: 2,
  },
  // Pinch to zoom play diagram
  pinchZoom: {
    min: 0.5,
    max: 3,
  },
  // Long press for quick actions
  longPressMenu: {
    duration: 500,
    haptic: true,
  },
};
```

### Loading and Error States

```typescript
// Standardized loading states
interface LoadingState {
  skeleton?: boolean;      // Show skeleton loader
  spinner?: boolean;       // Show spinner overlay
  progress?: number;       // Show progress bar (0-100)
  message?: string;        // Loading message
}

// Standardized error states
interface ErrorState {
  type: 'network' | 'validation' | 'server' | 'offline';
  message: string;
  retry?: () => void;     // Retry action
  fallback?: ReactNode;   // Fallback UI
}

// Loading component variants
const LoadingVariants = {
  skeleton: 'animate-pulse bg-neutral-200',
  spinner: 'animate-spin',
  fullscreen: 'fixed inset-0 bg-white/90 backdrop-blur',
  inline: 'inline-flex items-center gap-2',
};

// Error component variants  
const ErrorVariants = {
  banner: 'w-full p-4 bg-error/10 text-error border-l-4 border-error',
  toast: 'fixed bottom-20 left-4 right-4',
  inline: 'text-sm text-error mt-1',
  fullscreen: 'flex flex-col items-center justify-center min-h-[50vh]',
};
```

## Sprint 1 Components

### Authentication Components

#### SignIn Component
```typescript
interface SignInProps {
  onSuccess?: (user: User) => void;
  redirectTo?: string;
}

const SignInSpecs = {
  layout: 'centered-card',
  maxWidth: '400px',
  fields: [
    {
      name: 'email',
      type: 'email',
      autoComplete: 'email',
      autoFocus: true,
      validation: 'email|required',
      height: 56,
    },
    {
      name: 'password',
      type: 'password',
      autoComplete: 'current-password',
      validation: 'required|min:8',
      height: 56,
    },
  ],
  actions: {
    primary: {
      label: 'Sign In',
      height: 56,
      fullWidth: true,
      loadingText: 'Signing in...',
    },
    secondary: [
      { label: 'Forgot Password?', variant: 'link' },
      { label: 'Create Account', variant: 'ghost' },
    ],
  },
  features: [
    'Remember me toggle',
    'Biometric auth option',
    'Offline mode indicator',
    'Auto-redirect after success',
  ],
};
```

#### SignUp Component
```typescript
interface SignUpProps {
  includeTeamSetup?: boolean;
  onSuccess?: (user: User, team?: Team) => void;
}

const SignUpSpecs = {
  layout: 'multi-step',
  steps: [
    {
      id: 'account',
      title: 'Create Account',
      fields: ['email', 'password', 'confirmPassword'],
    },
    {
      id: 'profile',
      title: 'Coach Profile',
      fields: ['name', 'phone?', 'role'],
    },
    {
      id: 'team',
      title: 'Team Setup',
      fields: ['teamName', 'league', 'division?'],
      optional: true,
    },
  ],
  validation: {
    async: true,  // Check email uniqueness
    progressive: true,  // Validate as user types
  },
  features: [
    'Progress indicator',
    'Back navigation',
    'Save draft to localStorage',
    'Skip team setup option',
  ],
};
```

#### ForgotPassword Component
```typescript
interface ForgotPasswordProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ForgotPasswordSpecs = {
  layout: 'modal',
  steps: [
    {
      id: 'request',
      title: 'Reset Password',
      description: 'Enter your email to receive a reset link',
      field: 'email',
    },
    {
      id: 'confirmation',
      title: 'Check Your Email',
      description: 'We sent a reset link to {email}',
      actions: ['Resend', 'Back to Sign In'],
    },
  ],
  features: [
    'Rate limiting (1 request per minute)',
    'Clear success feedback',
    'Resend capability',
    'Auto-close after 10 seconds',
  ],
};
```

### Team Management Components

#### TeamCreate Component
```typescript
interface TeamCreateProps {
  onComplete: (team: Team) => void;
  allowSkip?: boolean;
}

const TeamCreateSpecs = {
  layout: 'full-screen',
  sections: [
    {
      title: 'Team Information',
      fields: [
        { name: 'name', placeholder: 'Thunder Hawks', required: true },
        { name: 'league', options: ['CFL', 'CJFL', 'U SPORTS'], required: true },
        { name: 'division', placeholder: 'Optional', required: false },
      ],
    },
    {
      title: 'Team Colors',
      component: 'ColorPicker',
      fields: ['primaryColor', 'secondaryColor'],
    },
    {
      title: 'Season Setup',
      fields: [
        { name: 'seasonYear', default: currentYear },
        { name: 'rosterSize', type: 'number', min: 12, max: 100 },
      ],
    },
  ],
  actions: {
    primary: 'Create Team & Add Players',
    secondary: 'Create Team Only',
    skip: 'Skip for Now',
  },
};
```

#### PlayerCard Component
```typescript
interface PlayerCardProps {
  player: Player;
  onEdit?: (player: Player) => void;
  onDelete?: (id: string) => void;
  variant?: 'compact' | 'detailed' | 'game';
  selectable?: boolean;
  selected?: boolean;
}

const PlayerCardSpecs = {
  variants: {
    compact: {
      height: 64,
      showFields: ['number', 'name', 'position'],
      swipeActions: true,
    },
    detailed: {
      height: 120,
      showFields: ['number', 'name', 'position', 'mpr', 'status'],
      expandable: true,
    },
    game: {
      height: 80,
      showFields: ['number', 'name', 'onField'],
      quickActions: ['sub', 'injury'],
    },
  },
  interactions: {
    tap: 'select or expand',
    swipeLeft: 'delete (with confirmation)',
    swipeRight: 'edit',
    longPress: 'quick actions menu',
  },
  states: {
    default: 'bg-white border-neutral-200',
    selected: 'bg-blue-50 border-blue-500',
    onField: 'bg-green-50 border-green-500',
    injured: 'bg-red-50 border-red-300 opacity-75',
  },
};
```

#### RosterGrid Component
```typescript
interface RosterGridProps {
  players: Player[];
  onPlayerSelect?: (player: Player) => void;
  onBulkAction?: (action: string, playerIds: string[]) => void;
  groupBy?: 'position' | 'number' | 'status';
  searchable?: boolean;
  filterable?: boolean;
}

const RosterGridSpecs = {
  layout: {
    mobile: 'single-column',
    tablet: 'two-column',
    desktop: 'three-column',
  },
  virtualization: {
    enabled: true,
    overscan: 3,
    itemHeight: 80,
    threshold: 20,  // Virtualize if > 20 players
  },
  features: [
    'Search by name/number',
    'Filter by position/status',
    'Sort by number/name/position',
    'Multi-select mode',
    'Bulk actions (delete, export)',
    'Pull-to-refresh',
    'Empty state',
  ],
  performance: {
    debounceSearch: 300,
    lazyLoadImages: true,
    memoizedCards: true,
  },
};
```

### Navigation Components

#### AppShell Component
```typescript
interface AppShellProps {
  children: ReactNode;
  user?: User;
  team?: Team;
}

const AppShellSpecs = {
  layout: {
    mobile: 'bottom-nav',
    tablet: 'side-rail',
    desktop: 'side-nav',
  },
  structure: {
    header: {
      height: 56,
      fixed: true,
      showOn: ['desktop'],
    },
    navigation: {
      position: 'bottom',
      height: 64,
      items: 5,  // Maximum for thumb reach
    },
    content: {
      padding: { top: 0, bottom: 64, left: 0, right: 0 },
      maxWidth: '100vw',
    },
    fab: {
      position: 'bottom-right',
      offset: { bottom: 80, right: 16 },
    },
  },
  safeAreas: {
    top: 'env(safe-area-inset-top)',
    bottom: 'calc(64px + env(safe-area-inset-bottom))',
  },
};
```

#### BottomNav Component
```typescript
interface BottomNavProps {
  items: NavItem[];
  activeItem?: string;
  onNavigate?: (item: NavItem) => void;
}

const BottomNavSpecs = {
  layout: {
    height: 64,
    background: 'bg-white border-t',
    position: 'fixed bottom-0',
    elevation: 'shadow-lg',
  },
  items: {
    max: 5,
    minWidth: 64,
    height: 64,
    iconSize: 24,
    labelSize: 12,
  },
  states: {
    inactive: 'text-neutral-500',
    active: 'text-blue-600',
    disabled: 'opacity-50 pointer-events-none',
  },
  animations: {
    tap: 'scale-95 transition-transform',
    switch: 'transition-colors duration-200',
  },
  a11y: {
    role: 'navigation',
    ariaLabel: 'Main navigation',
    itemRole: 'button',
  },
};
```

#### SlideOutPanel Component
```typescript
interface SlideOutPanelProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'full';
  children: ReactNode;
}

const SlideOutPanelSpecs = {
  sizes: {
    sm: '25%',
    md: '50%',
    lg: '75%',
    full: '100%',
  },
  mobile: {
    position: 'bottom',
    defaultSize: 'full',
    dragHandle: true,
    snapPoints: [0.25, 0.5, 0.9],
  },
  animations: {
    duration: 300,
    easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
    backdrop: 'fade',
    panel: 'slide',
  },
  gestures: {
    swipeToClose: true,
    threshold: 100,
    velocity: 0.5,
  },
};
```

### Offline Indicator Components

#### SyncStatus Component
```typescript
interface SyncStatusProps {
  status: 'synced' | 'syncing' | 'offline' | 'error';
  queueCount?: number;
  lastSync?: Date;
  onRetry?: () => void;
}

const SyncStatusSpecs = {
  variants: {
    minimal: {
      size: 'icon-only',
      position: 'header-right',
      showDetails: 'on-hover',
    },
    detailed: {
      size: 'full-width',
      position: 'below-header',
      showDetails: 'always',
    },
  },
  icons: {
    synced: 'CheckCircle',
    syncing: 'RefreshCw (animated)',
    offline: 'WifiOff',
    error: 'AlertCircle',
  },
  colors: {
    synced: 'text-green-600',
    syncing: 'text-blue-600',
    offline: 'text-yellow-600',
    error: 'text-red-600',
  },
  messages: {
    synced: 'All changes saved',
    syncing: 'Syncing {count} changes...',
    offline: '{count} changes pending',
    error: 'Sync failed. Tap to retry',
  },
};
```

#### OfflineBadge Component
```typescript
interface OfflineBadgeProps {
  show: boolean;
  position?: 'top' | 'bottom';
  dismissible?: boolean;
}

const OfflineBadgeSpecs = {
  appearance: {
    background: 'bg-yellow-100',
    text: 'text-yellow-900',
    icon: 'WifiOff',
    height: 40,
    animation: 'slide-in',
  },
  behavior: {
    autoShow: 'when offline for > 2s',
    autoHide: 'when online',
    persistent: 'in offline mode',
    tapAction: 'show sync details',
  },
  message: {
    offline: 'Offline Mode - Changes will sync when connected',
    reconnecting: 'Reconnecting...',
    syncing: 'Syncing offline changes...',
  },
};
```

### Form Components

#### TouchInput Component
```typescript
interface TouchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  clearable?: boolean;
  size?: 'default' | 'large';
}

const TouchInputSpecs = {
  sizes: {
    default: {
      height: 48,
      fontSize: 16,
      padding: '12px 16px',
    },
    large: {
      height: 56,
      fontSize: 18,
      padding: '16px 20px',
    },
  },
  features: [
    'Auto-zoom prevention (font-size: 16px min)',
    'Clear button on focus',
    'Floating label animation',
    'Error state with message',
    'Icon support (left/right)',
    'Native autocomplete support',
  ],
  states: {
    default: 'border-neutral-300',
    focus: 'border-blue-500 ring-2 ring-blue-500/20',
    error: 'border-red-500 ring-2 ring-red-500/20',
    disabled: 'bg-neutral-100 opacity-60',
  },
};
```

#### NumberPad Component
```typescript
interface NumberPadProps {
  value: string;
  onChange: (value: string) => void;
  max?: number;
  allowDecimal?: boolean;
  allowNegative?: boolean;
}

const NumberPadSpecs = {
  layout: {
    grid: '3x4',
    buttonSize: 64,
    spacing: 8,
    position: 'bottom-sheet',
  },
  buttons: [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['-/+', '0', 'DEL'],
  ],
  features: [
    'Haptic feedback on tap',
    'Sound feedback (optional)',
    'Auto-close on max length',
    'Decimal point support',
    'Negative number support',
    'Clear all gesture (long press DEL)',
  ],
  animations: {
    buttonPress: 'scale and highlight',
    slideIn: 'from bottom with spring',
  },
};
```

#### QuickSelect Component
```typescript
interface QuickSelectProps<T> {
  options: T[];
  value?: T;
  onChange: (value: T) => void;
  multiple?: boolean;
  columns?: 1 | 2 | 3;
}

const QuickSelectSpecs = {
  layout: {
    mobile: {
      columns: 2,
      buttonHeight: 48,
      gap: 8,
    },
    tablet: {
      columns: 3,
      buttonHeight: 44,
      gap: 12,
    },
  },
  variants: {
    chip: 'rounded-full px-4',
    card: 'rounded-lg p-4',
    button: 'rounded-md px-6',
  },
  interactions: {
    single: 'tap to select, auto-close',
    multiple: 'tap to toggle, confirm button',
  },
  states: {
    unselected: 'bg-white border-neutral-300',
    selected: 'bg-blue-600 text-white',
    disabled: 'opacity-50 pointer-events-none',
  },
};
```

## State Management Patterns

### Zustand Store Structure

```typescript
// Root store composition
interface RootStore {
  auth: AuthStore;
  team: TeamStore;
  game: GameStore;
  offline: OfflineStore;
  ui: UIStore;
}

// Auth store with persistence
interface AuthStore {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  signIn: (credentials: Credentials) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  
  // Persistence
  persist: {
    name: 'auth-storage',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ user: state.user }),
  };
}

// Offline queue store
interface OfflineStore {
  isOnline: boolean;
  queue: OfflineAction[];
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  failedActions: FailedAction[];
  
  // Actions
  addToQueue: (action: OfflineAction) => void;
  processQueue: () => Promise<void>;
  retryFailed: (actionId: string) => Promise<void>;
  clearQueue: () => void;
  
  // Persistence
  persist: {
    name: 'offline-queue',
    storage: createJSONStorage(() => localStorage),
    version: 1,
  };
}
```

### Optimistic Update Patterns

```typescript
// Optimistic update with rollback
const optimisticUpdate = async <T>(
  action: () => Promise<T>,
  optimistic: () => void,
  rollback: () => void,
  options?: {
    retries?: number;
    retryDelay?: number;
  }
) => {
  // Apply optimistic update immediately
  optimistic();
  
  try {
    // Perform actual action
    const result = await withRetry(action, options);
    return result;
  } catch (error) {
    // Rollback on failure
    rollback();
    
    // Queue for offline processing if network error
    if (isNetworkError(error)) {
      queueOfflineAction(action);
    }
    
    throw error;
  }
};

// Example usage in component
const updatePlayer = useMutation({
  mutationFn: (player: Player) => api.updatePlayer(player),
  onMutate: async (newPlayer) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['players']);
    
    // Snapshot previous value
    const previousPlayers = queryClient.getQueryData(['players']);
    
    // Optimistically update
    queryClient.setQueryData(['players'], (old) => 
      old.map(p => p.id === newPlayer.id ? newPlayer : p)
    );
    
    return { previousPlayers };
  },
  onError: (err, newPlayer, context) => {
    // Rollback on error
    queryClient.setQueryData(['players'], context.previousPlayers);
  },
  onSettled: () => {
    // Refetch after error or success
    queryClient.invalidateQueries(['players']);
  },
});
```

### Cache Invalidation Strategies

```typescript
// Granular cache invalidation
const cacheInvalidation = {
  // Invalidate specific queries
  player: (playerId: string) => 
    queryClient.invalidateQueries(['player', playerId]),
  
  // Invalidate related queries
  team: (teamId: string) => {
    queryClient.invalidateQueries(['team', teamId]);
    queryClient.invalidateQueries(['players', { teamId }]);
    queryClient.invalidateQueries(['games', { teamId }]);
  },
  
  // Smart invalidation based on mutation
  smart: (mutation: Mutation) => {
    const affected = getAffectedQueries(mutation);
    affected.forEach(key => queryClient.invalidateQueries(key));
  },
  
  // Time-based invalidation
  stale: () => {
    const staleTime = 5 * 60 * 1000; // 5 minutes
    queryClient.invalidateQueries({
      predicate: (query) => 
        Date.now() - query.state.dataUpdatedAt > staleTime,
    });
  },
};
```

### Error Recovery Flows

```typescript
// Comprehensive error recovery
interface ErrorRecovery {
  network: {
    retry: () => Promise<void>;
    fallback: () => void;
    queue: () => void;
  };
  validation: {
    highlight: (fields: string[]) => void;
    focus: (field: string) => void;
    suggest: (corrections: Record<string, string>) => void;
  };
  auth: {
    refreshToken: () => Promise<void>;
    reAuthenticate: () => void;
    logout: () => void;
  };
  data: {
    refetch: () => Promise<void>;
    reset: () => void;
    restore: (backup: any) => void;
  };
}

// Error boundary with recovery
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    // Log to error reporting service
    logErrorToService(error, errorInfo);
    
    // Attempt automatic recovery
    this.attemptRecovery(error);
  }
  
  attemptRecovery = (error) => {
    if (isNetworkError(error)) {
      // Retry after delay
      setTimeout(() => this.retry(), 3000);
    } else if (isAuthError(error)) {
      // Refresh auth token
      refreshAuthToken().then(() => this.retry());
    }
  };
  
  retry = () => {
    this.setState({ hasError: false, error: null });
  };
}
```

## Performance Specifications

### Bundle Size Targets

```typescript
// Bundle size budgets
const BUNDLE_BUDGETS = {
  initial: {
    js: 150,  // 150KB max for initial JS
    css: 50,  // 50KB max for initial CSS
    total: 200,  // 200KB total initial load
  },
  lazy: {
    maxChunkSize: 100,  // 100KB max per lazy chunk
  },
  images: {
    thumbnail: 20,  // 20KB for thumbnails
    full: 200,  // 200KB for full images
  },
  fonts: {
    subset: true,  // Use font subsets
    display: 'swap',  // Font display strategy
  },
};

// Rsbuild configuration for optimization
const rsbuildConfig = {
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
      override: {
        chunks: 'all',
        minSize: 20000,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|@tanstack)[\\/]/,
            priority: 40,
            name: 'framework',
          },
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|@headlessui)[\\/]/,
            priority: 30,
            name: 'ui',
          },
        },
      },
    },
    removeConsole: ['log', 'debug'],
    bundleAnalyze: process.env.ANALYZE === 'true',
  },
};
```

### Code Splitting Boundaries

```typescript
// Route-based code splitting
const routes = [
  {
    path: '/',
    component: lazy(() => import('./routes/Home')),
  },
  {
    path: '/game',
    component: lazy(() => import('./routes/Game')),
    preload: true,  // Preload critical route
  },
  {
    path: '/team',
    component: lazy(() => import('./routes/Team')),
  },
  {
    path: '/stats',
    component: lazy(() => import('./routes/Stats')),
  },
];

// Component-based splitting for heavy components
const HeavyChart = lazy(() => 
  import(/* webpackChunkName: "charts" */ './components/Charts')
);

const PlayDiagram = lazy(() =>
  import(/* webpackChunkName: "diagrams" */ './components/PlayDiagram')
);

// Preload critical chunks
const preloadCriticalChunks = () => {
  const critical = ['/game', '/team'];
  critical.forEach(path => {
    const route = routes.find(r => r.path === path);
    if (route?.preload) {
      route.component.preload();
    }
  });
};
```

### Virtual Scrolling Implementation

```typescript
// Virtual scrolling configuration
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualRoster = ({ players }: { players: Player[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: players.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,  // Estimated row height
    overscan: 3,  // Render 3 items outside viewport
    measureElement: (element) => element.getBoundingClientRect().height,
  });
  
  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <PlayerCard player={players[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Touch Response Optimization

```typescript
// Touch response optimizations
const TouchOptimizations = {
  // Use passive listeners for scroll performance
  passiveListeners: {
    touchstart: { passive: true },
    touchmove: { passive: true },
    wheel: { passive: true },
  },
  
  // Debounce/throttle expensive operations
  debounce: {
    search: 300,
    resize: 150,
    scroll: 100,
  },
  
  // Use CSS containment for performance
  cssContainment: {
    layout: 'contain: layout',
    paint: 'contain: paint',
    size: 'contain: size',
  },
  
  // Hardware acceleration
  gpu: {
    transform: 'translateZ(0)',
    willChange: 'transform',
    backfaceVisibility: 'hidden',
  },
  
  // Touch-action CSS for better scrolling
  touchAction: {
    default: 'manipulation',  // Disable double-tap zoom
    pan: 'pan-y',  // Allow vertical scrolling only
    pinch: 'pinch-zoom',  // Allow pinch zoom
  },
};

// Response time monitoring
const measureResponseTime = () => {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'measure') {
        if (entry.duration > 100) {
          console.warn(`Slow interaction: ${entry.name} took ${entry.duration}ms`);
        }
      }
    }
  });
  
  observer.observe({ entryTypes: ['measure'] });
};
```

## Accessibility Requirements

### ARIA Labels and Roles

```typescript
// Comprehensive ARIA implementation
const AriaPatterns = {
  // Navigation landmarks
  navigation: {
    main: { role: 'navigation', 'aria-label': 'Main navigation' },
    breadcrumb: { role: 'navigation', 'aria-label': 'Breadcrumb' },
    tabs: { role: 'tablist', 'aria-label': 'Game sections' },
  },
  
  // Interactive elements
  buttons: {
    icon: { 'aria-label': 'descriptive text', 'aria-pressed': boolean },
    toggle: { role: 'switch', 'aria-checked': boolean },
    menu: { 'aria-haspopup': 'menu', 'aria-expanded': boolean },
  },
  
  // Form elements
  forms: {
    required: { 'aria-required': 'true', 'aria-invalid': boolean },
    error: { 'aria-describedby': 'error-id', role: 'alert' },
    group: { role: 'group', 'aria-labelledby': 'legend-id' },
  },
  
  // Live regions
  live: {
    status: { role: 'status', 'aria-live': 'polite' },
    alert: { role: 'alert', 'aria-live': 'assertive' },
    timer: { role: 'timer', 'aria-live': 'off' },
  },
};
```

### Keyboard Navigation

```typescript
// Keyboard navigation patterns
const KeyboardNavigation = {
  // Focus trap for modals
  trapFocus: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    container.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });
  },
  
  // Roving tabindex for lists
  rovingTabIndex: (items: HTMLElement[]) => {
    let currentIndex = 0;
    
    items.forEach((item, index) => {
      item.tabIndex = index === 0 ? 0 : -1;
      
      item.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          currentIndex = (currentIndex + 1) % items.length;
          focusItem(currentIndex);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          currentIndex = (currentIndex - 1 + items.length) % items.length;
          focusItem(currentIndex);
        }
      });
    });
    
    const focusItem = (index: number) => {
      items.forEach((item, i) => {
        item.tabIndex = i === index ? 0 : -1;
      });
      items[index].focus();
    };
  },
};
```

### Focus Management

```typescript
// Focus management utilities
const FocusManagement = {
  // Save and restore focus
  saveFocus: () => {
    const activeElement = document.activeElement as HTMLElement;
    return () => activeElement?.focus();
  },
  
  // Focus first error in form
  focusFirstError: (form: HTMLFormElement) => {
    const firstError = form.querySelector('[aria-invalid="true"]') as HTMLElement;
    firstError?.focus();
  },
  
  // Skip links for keyboard users
  skipLinks: () => (
    <div className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4">
      <a href="#main" className="bg-blue-600 text-white px-4 py-2 rounded">
        Skip to main content
      </a>
      <a href="#nav" className="bg-blue-600 text-white px-4 py-2 rounded ml-2">
        Skip to navigation
      </a>
    </div>
  ),
  
  // Announce route changes
  announcePageChange: (title: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = `Navigated to ${title}`;
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  },
};
```

### High Contrast Mode

```typescript
// High contrast mode support
const HighContrastMode = {
  // CSS custom properties for high contrast
  cssVariables: `
    @media (prefers-contrast: high) {
      :root {
        --color-background: #000000;
        --color-foreground: #FFFFFF;
        --color-primary: #FFFF00;
        --color-secondary: #00FFFF;
        --color-danger: #FF00FF;
        --color-success: #00FF00;
        --border-width: 2px;
        --focus-outline: 3px solid var(--color-primary);
      }
    }
  `,
  
  // Forced colors mode (Windows High Contrast)
  forcedColors: `
    @media (forced-colors: active) {
      button {
        border: 1px solid ButtonText;
      }
      
      a {
        forced-color-adjust: none;
        color: LinkText;
      }
      
      .selected {
        background: Highlight;
        color: HighlightText;
        forced-color-adjust: none;
      }
    }
  `,
  
  // Component adjustments for high contrast
  componentAdjustments: {
    button: 'border-2 border-current',
    input: 'border-2 border-current focus:ring-4',
    card: 'border-2 border-current',
    badge: 'border border-current',
  },
  
  // Icon adjustments
  iconAdjustments: {
    strokeWidth: 2.5,
    size: 'larger',
    ariaHidden: false,
  },
};
```

## Implementation Priority

### Phase 1: Foundation (Day 1-2)
1. Project setup with Rsbuild and TanStack Router
2. Tailwind 4 configuration with design tokens
3. Zustand store architecture
4. Base component library setup

### Phase 2: Authentication (Day 2-3)
1. Auth UI components
2. Form validation patterns
3. Offline-capable auth flow
4. Session management

### Phase 3: Team Management (Day 3-4)
1. Team creation flow
2. Player management interface
3. Roster virtualization
4. Bulk import functionality

### Phase 4: Navigation & Layout (Day 4-5)
1. App shell with responsive navigation
2. Offline indicators
3. Touch gesture implementation
4. Accessibility features

### Phase 5: Integration (Day 5)
1. TanStack Query setup
2. Optimistic updates
3. Error boundaries
4. Performance optimization

## Testing Strategy

### Component Testing
- Unit tests for all atomic components
- Integration tests for organisms
- Visual regression tests for UI states
- Accessibility audits with axe-core

### Performance Testing
- Lighthouse CI for Core Web Vitals
- Bundle size monitoring
- Runtime performance profiling
- Touch response time measurement

### Device Testing
- Real device testing on iOS/Android
- Offline mode validation
- Gesture testing with gloves
- Sunlight readability verification

## Documentation Requirements

### Component Documentation
- Storybook for component library
- Props documentation with TypeScript
- Usage examples and best practices
- Accessibility guidelines

### Developer Documentation
- Setup and configuration guides
- State management patterns
- Performance optimization tips
- Debugging techniques

---

This specification provides the complete blueprint for Sprint 1 UI development. All components are designed with coaches in mind - thumb-friendly, glove-compatible, and optimized for outdoor use on muddy sidelines.