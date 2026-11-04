/** Main product areas; implementation details stay inside their sections. */
export const navigationItems = [
  {
    id: 'home',
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    image: require('../assets/images/main-page-icon-light.png') as number,
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    imageDark: require('../assets/images/main-page-icon-dark.png') as number,
    href: '/',
  },
  {
    id: 'science',
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    image: require('../assets/images/science-icon-ocean.png') as number,
  },
  {
    id: 'events',
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    image: require('../assets/images/events-icon-ocean.png') as number,
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    imageDark: require('../assets/images/events-icon-ocean.png') as number,
    href: '/events',
  },
  {
    id: 'community',
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    image: require('../assets/images/community-icon-light.png') as number,
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    imageDark: require('../assets/images/community-icon-dark.png') as number,
  },
  {
    id: 'map',
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    image: require('../assets/images/map-icon-light.png') as number,
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    imageDark: require('../assets/images/map-icon-dark.png') as number,
  },
  {
    id: 'brain',
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    image: require('../assets/images/brain-icon-ocean.png') as number,
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    imageDark: require('../assets/images/brain-icon-ocean.png') as number,
  },
  {
    id: 'myths',
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    image: require('../assets/images/myths-icon-light.png') as number,
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    imageDark: require('../assets/images/myths-icon-dark.png') as number,
  },
] as const;

/** Expandable subsections beneath Science & Discover in the shared menu. */
export const scienceNavigationItems = [
  {
    id: 'articles',
    href: '/science',
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    image: require('../assets/images/articles-icon-ocean.png') as number,
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    imageDark: require('../assets/images/articles-icon-ocean.png') as number,
  },
  {
    id: 'quizzes',
    href: '/science/quizzes',
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    image: require('../assets/images/quizzes-icon-ocean.png') as number,
  },
  {
    id: 'flashcards',
    href: '/science/flashcards',
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    image: require('../assets/images/flashcards-icon-light.png') as number,
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- static asset require
    imageDark: require('../assets/images/flashcards-icon-dark.png') as number,
  },
] as const;
