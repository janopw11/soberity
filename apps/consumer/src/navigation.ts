/** Main product areas; implementation details stay inside their sections. */
export const navigationItems = [
  {
    id: 'home',
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    image: require('../assets/images/main-page-icon.png') as number,
    href: '/',
  },
  {
    id: 'science',
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    image: require('../assets/images/science-icon.png') as number,
    href: '/science',
  },
  {
    id: 'events',
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    image: require('../assets/images/events-icon.png') as number,
    href: '/events',
  },
  {
    id: 'community',
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    image: require('../assets/images/community-icon.png') as number,
  },
  {
    id: 'map',
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    image: require('../assets/images/map-icon.png') as number,
  },
  {
    id: 'brain',
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    image: require('../assets/images/brain-icon.png') as number,
  },
  {
    id: 'myths',
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    image: require('../assets/images/myths-icon.png') as number,
  },
] as const;

/** Always visible subsections beneath Science & Discover in the shared menu. */
export const scienceNavigationItems = [
  {
    id: 'articles',
    href: '/science',
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    image: require('../assets/images/articles-icon.png') as number,
  },
  {
    id: 'quizzes',
    href: '/science/quizzes',
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    image: require('../assets/images/quizzes-icon.png') as number,
  },
  {
    id: 'flashcards',
    href: '/science/flashcards',
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    image: require('../assets/images/flashcards-icon.png') as number,
  },
] as const;
