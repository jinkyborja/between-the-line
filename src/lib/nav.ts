import type { IconName } from './icons';

export type NavItem = { href: string; label: string; icon: IconName; private?: boolean };

export const mainNav: NavItem[] = [
	{ href: '/discover', label: 'Discover', icon: 'discover' },
	{ href: '/library', label: 'Poetry Library', icon: 'library' },
	{ href: '/journal', label: 'My Journal', icon: 'journal', private: true },
	{ href: '/community', label: 'Community', icon: 'community' },
	{ href: '/bookmarks', label: 'Bookmarks', icon: 'bookmark' }
];

export const accountNav: NavItem[] = [
	{ href: '/account', label: 'Account', icon: 'account' },
	{ href: '/settings', label: 'Settings', icon: 'settings' }
];

export const isActive = (pathname: string, href: string) =>
	pathname === href || pathname.startsWith(href + '/');
