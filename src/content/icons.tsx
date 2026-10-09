import type { ComponentType } from 'react'
import {
  AlarmClock, Apple, Banana, Bath, Bean, Bed, Bike, BookOpen, Bus, Car, Cat, Cookie, Dog, Droplets, Flower2,
  Footprints, Gamepad2, Grape, Hand, HandHeart, HeartHandshake, IceCreamCone, Laugh, Leaf, Moon, Music, Pizza,
  Plane, Rabbit, Shirt, ShowerHead, SoapDispenserDroplet, Soup, Sprout, Timer, Toilet, ToyBrick, Tv, UserRound,
  Users, Utensils, Wind, Zap,
  type LucideProps,
} from 'lucide-react'
import { Crosswalk, DOT_COLORS, Dot, Face, Germs, Toothbrush, TrafficLight } from './art'

/** Rəng tonu: ikonun arxa fonu və rəngi (Wada №218 palitrası) */
export type IconTone = 'brand' | 'lavender' | 'mint' | 'peach' | 'berry' | 'violet' | 'ink'

export const TONE_CLASS: Record<IconTone, string> = {
  brand: 'bg-brand-100 text-brand-700',
  lavender: 'bg-lavender-100 text-lavender-800',
  mint: 'bg-mint-100 text-mint-700',
  peach: 'bg-peach-100 text-peach-800',
  berry: 'bg-berry-100 text-berry-700',
  violet: 'bg-violet-100 text-violet-700',
  ink: 'bg-ink-100 text-ink-700',
}

type Entry = { tone: IconTone } & ({ lucide: ComponentType<LucideProps> } | { art: (size: number) => React.ReactNode })

const L = (lucide: ComponentType<LucideProps>, tone: IconTone): Entry => ({ lucide, tone })
const A = (art: (size: number) => React.ReactNode, tone: IconTone): Entry => ({ art, tone })

export const ICONS = {
  // gigiyena
  germs: A((s) => <Germs size={s} />, 'mint'),
  soap: L(SoapDispenserDroplet, 'lavender'),
  water: L(Droplets, 'brand'),
  hands: L(Hand, 'peach'),
  rub: L(HandHeart, 'peach'),
  shower: L(ShowerHead, 'brand'),
  dry: L(Wind, 'mint'),
  meal: L(Utensils, 'peach'),
  tv: L(Tv, 'ink'),
  toy: L(ToyBrick, 'violet'),
  toilet: L(Toilet, 'ink'),
  run: L(Footprints, 'ink'),
  cookie: L(Cookie, 'peach'),
  timer: L(Timer, 'brand'),
  song: L(Music, 'violet'),
  flash: L(Zap, 'peach'),
  // təhlükəsizlik
  'light-all': A((s) => <TrafficLight on="all" size={s} />, 'ink'),
  'light-red': A((s) => <TrafficLight on="red" size={s} />, 'ink'),
  'light-yellow': A((s) => <TrafficLight on="yellow" size={s} />, 'ink'),
  'light-green': A((s) => <TrafficLight on="green" size={s} />, 'ink'),
  stop: L(Hand, 'berry'),
  together: L(Users, 'mint'),
  alone: L(UserRound, 'ink'),
  crosswalk: A((s) => <Crosswalk size={s} />, 'lavender'),
  car: L(Car, 'brand'),
  // emosiyalar
  'face-happy': A((s) => <Face kind="happy" size={s} />, 'peach'),
  'face-sad': A((s) => <Face kind="sad" size={s} />, 'lavender'),
  'face-angry': A((s) => <Face kind="angry" size={s} />, 'berry'),
  'face-scared': A((s) => <Face kind="scared" size={s} />, 'violet'),
  'face-sleepy': A((s) => <Face kind="sleepy" size={s} />, 'lavender'),
  'face-neutral': A((s) => <Face kind="neutral" size={s} />, 'ink'),
  icecream: L(IceCreamCone, 'peach'),
  'broken-toy': L(ToyBrick, 'berry'),
  dog: L(Dog, 'peach'),
  queue: L(Users, 'lavender'),
  hug: L(HeartHandshake, 'mint'),
  laugh: L(Laugh, 'peach'),
  // gündəlik rutin
  alarm: L(AlarmClock, 'brand'),
  teeth: A((s) => <Toothbrush size={s} />, 'lavender'),
  shirt: L(Shirt, 'violet'),
  breakfast: L(Soup, 'peach'),
  dinner: L(Utensils, 'peach'),
  bath: L(Bath, 'brand'),
  pyjama: L(Moon, 'lavender'),
  sleep: L(Bed, 'violet'),
  seed: L(Bean, 'peach'),
  sprout: L(Sprout, 'mint'),
  plant: L(Leaf, 'mint'),
  flower: L(Flower2, 'violet'),
  // fərqli olanı tap
  apple: L(Apple, 'berry'),
  banana: L(Banana, 'peach'),
  grape: L(Grape, 'violet'),
  cat: L(Cat, 'ink'),
  rabbit: L(Rabbit, 'lavender'),
  plane: L(Plane, 'brand'),
  'dot-red': A((s) => <Dot color={DOT_COLORS.red} size={s} />, 'ink'),
  'dot-blue': A((s) => <Dot color={DOT_COLORS.blue} size={s} />, 'ink'),
  pizza: L(Pizza, 'peach'),
  bus: L(Bus, 'brand'),
  bike: L(Bike, 'mint'),
  // menyu
  book: L(BookOpen, 'brand'),
  game: L(Gamepad2, 'violet'),
} satisfies Record<string, Entry>

export type IconKey = keyof typeof ICONS

/** Rəngli dairə içində ikon (uşaq rejimi və dərs menyusu üçün). */
export function LessonIcon({ name, size = 'md', className = '' }: { name: IconKey; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const e = ICONS[name] as Entry
  const box = { sm: 'h-12 w-12', md: 'h-20 w-20', lg: 'h-28 w-28', xl: 'h-36 w-36' }[size]
  const px = { sm: 26, md: 44, lg: 62, xl: 84 }[size]
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full ${box} ${TONE_CLASS[e.tone]} ${className}`} aria-hidden>
      {'lucide' in e ? <e.lucide size={px * 0.78} strokeWidth={2} /> : e.art(px)}
    </span>
  )
}
