import type { SkillCode } from '../lib/types'
import type { IconKey, IconTone } from './icons'

/**
 * Dərs kontenti. Mətnlər Azərbaycan dilindədir (MVP), menyu başlıqları 3 dildə.
 * Şəkillər vahid stilli SVG ikonlar və illüstrasiyalardır (content/icons.tsx) — AI ilə yaradılmış şəkil yoxdur.
 * `gradedStepCount(lesson)` DB-dəki lessons.step_count ilə eyni olmalıdır
 * (tests/content.test.ts yoxlayır).
 */

export interface Option {
  id: string
  icon: IconKey
  label: string
}

export type Step =
  | { id: string; type: 'info'; icons: IconKey[]; text: string }
  | { id: string; type: 'choice'; icon?: IconKey; prompt: string; options: Option[]; correct: string }
  | { id: string; type: 'order'; prompt: string; items: Option[] } // items düzgün ardıcıllıqdadır

export interface Lesson {
  slug: string
  skill: SkillCode
  kind: 'lesson' | 'game'
  icon: IconKey
  title: { az: string; en: string; ru: string }
  steps: Step[]
}

export const LESSONS: Lesson[] = [
  {
    slug: 'hand-washing',
    skill: 'hygiene',
    kind: 'lesson',
    icon: 'soap',
    title: { az: 'Əllərimizi yuyuruq', en: 'Washing our hands', ru: 'Моем руки' },
    steps: [
      { id: 'i1', type: 'info', icons: ['germs'], text: 'Əllərimizdə gözə görünməyən mikroblar olur.' },
      { id: 'i2', type: 'info', icons: ['soap', 'water'], text: 'Sabun və su mikrobları yuyub aparır.' },
      {
        id: 'q1', type: 'choice', icon: 'meal', prompt: 'Yeməkdən əvvəl nə edirik?', correct: 'a',
        options: [
          { id: 'a', icon: 'hands', label: 'Əllərimizi yuyuruq' },
          { id: 'b', icon: 'tv', label: 'Televizora baxırıq' },
          { id: 'c', icon: 'toy', label: 'Oyuncaqla oynayırıq' },
        ],
      },
      {
        id: 'q2', type: 'order', prompt: 'Əl yumağın addımlarını düz:',
        items: [
          { id: 'wet', icon: 'water', label: 'Əlləri islat' },
          { id: 'soap', icon: 'soap', label: 'Sabun sürt' },
          { id: 'rub', icon: 'rub', label: 'Yaxşıca ov' },
          { id: 'rinse', icon: 'shower', label: 'Yaxala' },
          { id: 'dry', icon: 'dry', label: 'Qurula' },
        ],
      },
      {
        id: 'q3', type: 'choice', icon: 'toilet', prompt: 'Tualetdən sonra nə edirik?', correct: 'b',
        options: [
          { id: 'a', icon: 'run', label: 'Qaçıb oynamağa gedirik' },
          { id: 'b', icon: 'soap', label: 'Əllərimizi sabunla yuyuruq' },
          { id: 'c', icon: 'cookie', label: 'Peçenye yeyirik' },
        ],
      },
      {
        id: 'q4', type: 'choice', icon: 'timer', prompt: 'Əllərimizi nə qədər ovmalıyıq?', correct: 'a',
        options: [
          { id: 'a', icon: 'song', label: 'Bir mahnı qədər (20 saniyə)' },
          { id: 'b', icon: 'flash', label: 'Bir saniyə' },
        ],
      },
    ],
  },
  {
    slug: 'road-crossing',
    skill: 'safety',
    kind: 'lesson',
    icon: 'light-all',
    title: { az: 'Yolu təhlükəsiz keçirik', en: 'Crossing the road safely', ru: 'Безопасно переходим дорогу' },
    steps: [
      { id: 'i1', type: 'info', icons: ['light-all'], text: 'Svetofor bizə nə vaxt keçmək olar deyir.' },
      { id: 'i2', type: 'info', icons: ['light-red', 'light-green'], text: 'Qırmızı — dayan. Yaşıl — diqqətlə keç.' },
      {
        id: 'q1', type: 'choice', icon: 'light-red', prompt: 'İşıq qırmızıdır. Nə edirik?', correct: 'a',
        options: [
          { id: 'a', icon: 'stop', label: 'Dayanırıq' },
          { id: 'b', icon: 'run', label: 'Qaçıb keçirik' },
        ],
      },
      {
        id: 'q2', type: 'choice', prompt: 'Hansı işıqda yolu keçirik?', correct: 'c',
        options: [
          { id: 'a', icon: 'light-red', label: 'Qırmızı' },
          { id: 'b', icon: 'light-yellow', label: 'Sarı' },
          { id: 'c', icon: 'light-green', label: 'Yaşıl' },
        ],
      },
      {
        id: 'q3', type: 'choice', icon: 'car', prompt: 'Yolu kiminlə keçirik?', correct: 'a',
        options: [
          { id: 'a', icon: 'together', label: 'Böyüklə, əl-ələ' },
          { id: 'b', icon: 'alone', label: 'Tək başıma' },
        ],
      },
      {
        id: 'q4', type: 'choice', prompt: 'Yolu harada keçirik?', correct: 'a',
        options: [
          { id: 'a', icon: 'crosswalk', label: 'Piyada keçidində' },
          { id: 'b', icon: 'car', label: 'Maşınların arasından' },
        ],
      },
    ],
  },
  {
    slug: 'emotions',
    skill: 'emotions',
    kind: 'lesson',
    icon: 'face-happy',
    title: { az: 'Hisslərimizi tanıyırıq', en: 'Recognising feelings', ru: 'Узнаём чувства' },
    steps: [
      { id: 'i1', type: 'info', icons: ['face-happy', 'face-sad', 'face-angry', 'face-scared'], text: 'Hər kəs fərqli hisslər yaşayır. Bu, normaldır.' },
      {
        id: 'q1', type: 'choice', icon: 'icecream', prompt: 'Uşağa dondurma aldılar. O necə hiss edir?', correct: 'a',
        options: [
          { id: 'a', icon: 'face-happy', label: 'Sevinir' },
          { id: 'b', icon: 'face-sad', label: 'Kədərlənir' },
          { id: 'c', icon: 'face-angry', label: 'Əsəbiləşir' },
        ],
      },
      {
        id: 'q2', type: 'choice', icon: 'broken-toy', prompt: 'Sevimli oyuncağı sındı. O necə hiss edir?', correct: 'b',
        options: [
          { id: 'a', icon: 'face-happy', label: 'Sevinir' },
          { id: 'b', icon: 'face-sad', label: 'Kədərlənir' },
          { id: 'c', icon: 'face-sleepy', label: 'Yuxusu gəlir' },
        ],
      },
      {
        id: 'q3', type: 'choice', icon: 'dog', prompt: 'Böyük it bərkdən hürdü. O necə hiss edir?', correct: 'c',
        options: [
          { id: 'a', icon: 'face-happy', label: 'Sevinir' },
          { id: 'b', icon: 'face-angry', label: 'Əsəbiləşir' },
          { id: 'c', icon: 'face-scared', label: 'Qorxur' },
        ],
      },
      {
        id: 'q4', type: 'choice', icon: 'queue', prompt: 'Kimsə növbəni pozub qabağa keçdi. O necə hiss edir?', correct: 'a',
        options: [
          { id: 'a', icon: 'face-angry', label: 'Əsəbiləşir' },
          { id: 'b', icon: 'face-happy', label: 'Sevinir' },
          { id: 'c', icon: 'face-scared', label: 'Qorxur' },
        ],
      },
      {
        id: 'q5', type: 'choice', icon: 'face-sad', prompt: 'Dostun ağlayır. Nə edə bilərik?', correct: 'a',
        options: [
          { id: 'a', icon: 'hug', label: 'Yanına gedib nə olduğunu soruşuram' },
          { id: 'b', icon: 'laugh', label: 'Gülürəm' },
          { id: 'c', icon: 'run', label: 'Qaçıram' },
        ],
      },
    ],
  },
  {
    slug: 'daily-routine',
    skill: 'cognitive',
    kind: 'game',
    icon: 'alarm',
    title: { az: 'Günümü düzürəm', en: 'Order my day', ru: 'Мой распорядок дня' },
    steps: [
      {
        id: 'q1', type: 'order', prompt: 'Səhər nə edirik? Ardıcıllıqla düz:',
        items: [
          { id: 'wake', icon: 'alarm', label: 'Oyanıram' },
          { id: 'teeth', icon: 'teeth', label: 'Dişlərimi fırçalayıram' },
          { id: 'dress', icon: 'shirt', label: 'Geyinirəm' },
          { id: 'breakfast', icon: 'breakfast', label: 'Səhər yeməyi yeyirəm' },
        ],
      },
      {
        id: 'q2', type: 'order', prompt: 'Axşam nə edirik? Ardıcıllıqla düz:',
        items: [
          { id: 'dinner', icon: 'dinner', label: 'Şam yeməyi' },
          { id: 'bath', icon: 'bath', label: 'Çimirəm' },
          { id: 'pyjama', icon: 'pyjama', label: 'Pijama geyinirəm' },
          { id: 'sleep', icon: 'sleep', label: 'Yatıram' },
        ],
      },
      {
        id: 'q3', type: 'order', prompt: 'Bitki necə böyüyür?',
        items: [
          { id: 'seed', icon: 'seed', label: 'Toxum' },
          { id: 'sprout', icon: 'sprout', label: 'Cücərti' },
          { id: 'plant', icon: 'plant', label: 'Bitki' },
          { id: 'flower', icon: 'flower', label: 'Çiçək' },
        ],
      },
    ],
  },
  {
    slug: 'odd-one-out',
    skill: 'cognitive',
    kind: 'game',
    icon: 'dot-blue',
    title: { az: 'Fərqli olanı tap', en: 'Find the odd one', ru: 'Найди лишнее' },
    steps: [
      {
        id: 'q1', type: 'choice', prompt: 'Hansı fərqlidir?', correct: 'd',
        options: [
          { id: 'a', icon: 'apple', label: 'Alma' },
          { id: 'b', icon: 'banana', label: 'Banan' },
          { id: 'c', icon: 'grape', label: 'Üzüm' },
          { id: 'd', icon: 'car', label: 'Maşın' },
        ],
      },
      {
        id: 'q2', type: 'choice', prompt: 'Hansı fərqlidir?', correct: 'c',
        options: [
          { id: 'a', icon: 'dog', label: 'İt' },
          { id: 'b', icon: 'cat', label: 'Pişik' },
          { id: 'c', icon: 'plane', label: 'Təyyarə' },
          { id: 'd', icon: 'rabbit', label: 'Dovşan' },
        ],
      },
      {
        id: 'q3', type: 'choice', prompt: 'Hansı rəng fərqlidir?', correct: 'b',
        options: [
          { id: 'a', icon: 'dot-red', label: 'Qırmızı' },
          { id: 'b', icon: 'dot-blue', label: 'Göy' },
          { id: 'c', icon: 'dot-red', label: 'Qırmızı' },
          { id: 'd', icon: 'dot-red', label: 'Qırmızı' },
        ],
      },
      {
        id: 'q4', type: 'choice', prompt: 'Hansı fərqlidir?', correct: 'a',
        options: [
          { id: 'a', icon: 'pizza', label: 'Pizza' },
          { id: 'b', icon: 'car', label: 'Maşın' },
          { id: 'c', icon: 'bus', label: 'Avtobus' },
          { id: 'd', icon: 'bike', label: 'Velosiped' },
        ],
      },
    ],
  },
]

export function gradedStepCount(lesson: Lesson): number {
  return lesson.steps.filter((s) => s.type !== 'info').length
}

export function findLesson(slug: string | undefined): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug)
}

export const SKILL_ICON: Record<SkillCode, IconKey> = {
  hygiene: 'soap',
  safety: 'light-all',
  emotions: 'face-happy',
  cognitive: 'alarm',
}

export const SKILL_TONE: Record<SkillCode, IconTone> = {
  hygiene: 'mint',
  safety: 'peach',
  emotions: 'violet',
  cognitive: 'brand',
}

/** Qrafik xətləri: Green Blue, Khaki, Aconite Violet, Helvetia Blue (Wada №218 və cütləri) */
export const SKILL_COLOR: Record<SkillCode, string> = {
  hygiene: '#099197',
  safety: '#bc892b',
  emotions: '#a36aa5',
  cognitive: '#005b8d',
}
