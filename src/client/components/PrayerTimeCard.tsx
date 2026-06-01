import { h } from 'preact';
import { Sun, Sunrise, Cloud, Sunset, Moon, Clock } from 'lucide-preact';

const iconMap: Record<string, typeof Sun> = {
  Subuh: Sunrise,
  Terbit: Sun,
  Dzuhur: Sun,
  Ashar: Cloud,
  Maghrib: Sunset,
  Isya: Moon,
};

interface Props {
  name: string;
  time: string;
  isNext?: boolean;
}

export function PrayerTimeCard({ name, time, isNext }: Props) {
  const Icon = iconMap[name] ?? Clock;

  return (
    <div class={`prayer-card${isNext ? ' prayer-card--next' : ''}`}>
      <div class="prayer-card__icon">
        <Icon size={20} />
      </div>
      <div class="prayer-card__info">
        <span class="prayer-card__name">{name}</span>
        <span class="prayer-card__time">{time}</span>
      </div>
    </div>
  );
}
