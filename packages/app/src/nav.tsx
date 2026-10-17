import { createContext, useContext, type ReactNode } from 'react';
import { Pressable, type PressableProps } from 'react-native';

// Platform-neutral navigation. Next (web) and Expo Router (native) both route by
// URL path, so shared screens only deal in hrefs; each app plugs in its router.

export interface Nav {
  push(href: string): void;
  replace(href: string): void;
  back(): void;
}

const NavContext = createContext<Nav>({
  push: () => {},
  replace: () => {},
  back: () => {},
});

export function NavProvider({ nav, children }: { nav: Nav; children: ReactNode }) {
  return <NavContext.Provider value={nav}>{children}</NavContext.Provider>;
}

export const useNav = () => useContext(NavContext);

export const routes = {
  profile: (handle: string) => `/@${handle}`,
  log: () => '/log',
  rank: (bookId: string, rerank = false) => `/rank/${bookId}${rerank ? '?rerank=1' : ''}`,
  card: (readId: string) => `/c/${readId}`,
  design: () => '/design',
};

export interface LinkProps extends Omit<PressableProps, 'onPress'> {
  href: string;
  children: PressableProps['children'];
}

export function Link({ href, ...rest }: LinkProps) {
  const nav = useNav();
  return <Pressable accessibilityRole="link" {...rest} onPress={() => nav.push(href)} />;
}
