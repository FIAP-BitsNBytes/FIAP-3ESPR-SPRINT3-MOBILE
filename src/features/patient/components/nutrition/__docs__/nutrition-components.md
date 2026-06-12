# Nutrition Components

## Overview

The nutrition feature provides a comprehensive set of components for tracking meal plans, logging water intake, recording free meals, and monitoring smart bottle hydration.

## Components

### WaterBar

**Purpose**: Visual representation of water intake progress.

**Props**:
```typescript
interface WaterBarProps {
  current: number;  // Current water in ml
  target: number;   // Target water in ml
  size?: 'sm' | 'md' | 'lg';
}
```

**Usage**:
```tsx
<WaterBar current={1500} target={2000} size="md" />
```

**Features**:
- Animated progress fill
- Responsive sizing
- Color changes based on completion (muted → primary → success)

---

### NutritionTabBar

**Purpose**: Tab navigation between plan view, water/extras tracking, and free meals.

**Props**:
```typescript
interface NutritionTabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

type Tab = 'plan' | 'extras' | 'freeMeals';
```

---

### WaterSection

**Purpose**: Water intake logging and display with quick-log buttons. Optionally shows an "IoT" pill badge and a "via SmartBottle (IoT)" sub-label when any of today's WATER logs were inserted by the SmartBottle IoT integration (`source === 'IOT'`).

**Props**:
```typescript
interface WaterSectionProps {
  waterMl: number;
  isLogging: boolean;
  onLogWater: (ml: number) => void;
  /** When true, shows a compact "via SmartBottle (IoT)" indicator. */
  hasIotEntries?: boolean;
}
```

**Usage**:
```tsx
<WaterSection 
  waterMl={1500}
  isLogging={false}
  onLogWater={(ml) => handleWater(ml)}
  hasIotEntries={hasIotWater}
/>
```

`hasIotWater` is derived in the parent screen via:
```ts
const hasIotWater = useMemo(
  () => meals.some(m => m.category === 'WATER' && m.source?.toUpperCase() === 'IOT'),
  [meals],
);
```

---

### SmartBottleCard

**Purpose**: Real-time hydration tracking from IoT SmartBottles via MQTT.

**Features**:
- Real-time status display: Battery, signal strength, last intake
- Device info: MAC address, battery percentage, RSSI
- Manual logging fallback if MQTT unavailable
- Collapsible details section
- Three responsive states: Connected, Disconnected, Error

**Usage**:
```tsx
<SmartBottleCard 
  onLogHydration={(ml) => handleWater(ml)}
  brokerUrl="mqtt://your-broker:8080"
/>
```

**Integration with NutritionScreen**:
```tsx
{activeTab === 'extras' && (
  <ScrollView>
    <WaterSection ... />
    <SmartBottleCard onLogHydration={handleWater} />
    {/* Free meals section */}
  </ScrollView>
)}
```

---

### FreeMealModal

**Purpose**: Modal dialog for logging meals not in the daily plan.

**Features**:
- Form with validation
- Unit picker (g, ml, units, portions)
- Optional calories input
- Loading state on submit

---

## Data Flow

### SmartBottle Hydration
```
MQTT Broker publishes message
    ↓
useSmartBottle hook receives via MQTT client
    ↓
Event validated & parsed
    ↓
Supabase smart_bottle_logs insert
    ↓
SmartBottleCard displays status
```

---

## Styling

All components use centralized design tokens from `@shared/theme`.

## Error Handling

- **SmartBottleCard**: Connection errors display with fallback manual buttons
- **Invalid payload**: Logged to console, doesn't crash component
- **Database errors**: Passed to parent via callback

---

## Performance

- SmartBottleCard: ~8KB (minified, with hooks)
- Real-time subscriptions use native Supabase realtime
- Optimized with useMemo for grouped items

---

## Future Enhancements

- [ ] Photo support (before/after meal photos)
- [ ] Barcode scanning for quick logging
- [ ] AI-powered calorie estimation
- [ ] Nutritionist comments on logs (real-time)
- [ ] Meal recommendations
- [ ] Local notification reminders
- [ ] Offline mode with sync
