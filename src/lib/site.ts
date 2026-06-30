// Central site constants — brand, links, conversion targets.
export const SITE = {
  name: 'JavaJub',
  title: 'JavaJub — реальные вопросы с собеседований Java по компаниям',
  url: 'https://www.javajub.com',
  description:
    'Реальные вопросы с собеседований Java по конкретным компаниям — Сбер, Т-Банк, Альфа, ВТБ, Яндекс, VK, Ozon и десяткам других. Гайды по грейдам, тесты и подготовка к интервью. Не «топ-100 из интернета», а то, что спрашивают на самом деле.',
} as const;

export const LINKS = {
  telegram: 'https://t.me/java_jub',
  telegramPro: 'https://t.me/Java_Jub_Pro',
  subBot: 'https://t.me/java_jub_subscriptions_bot',
  github: 'https://github.com/JavaJub/java-interview',
} as const;

// Telegram join with a source tag for attribution.
export const tg = (source: string) => `${LINKS.telegram}?source=${encodeURIComponent(source)}`;

// Feature flags. Both OFF until the operator files the Roskomnadzor personal-data
// notification (152-ФЗ) and sets up payment/оферта. While OFF the site collects
// NO personal data and takes NO payment — заявки и оплата уходят в Telegram.
// Flip to true to re-enable the on-site form / checkout.
export const FEATURES = {
  collectData: false, // order + digest forms (email/phone/Telegram → backend)
  payOnSite: false,   // on-site Pro checkout via ЮKassa
} as const;

export const NAV = [
  { href: '/guides/', label: 'Гайды' },
  { href: '/companies/', label: 'Компании' },
  { href: '/questions/', label: 'Вопросы' },
  { href: '/quizzes/', label: 'Тесты' },
  { href: '/order/', label: 'Заказать гайд' },
  { href: '/pro/', label: 'Pro' },
] as const;

export const GRADE_ORDER = ['Trainee', 'Junior', 'Junior+', 'Middle', 'Middle+', 'Senior', 'Lead'];
