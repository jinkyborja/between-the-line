import type { IconName } from './icons';

export type NavItem = {
	href: string;
	label: string;
	icon: IconName;
	/** Shows a lock: the page holds private writing. */
	private?: boolean;
	/** Shows the unread-notification count. */
	badge?: 'unread';
	adminOnly?: boolean;
};

export type NavGroup = { label: string; items: NavItem[] };

/** One source of truth for the sidebar, tablet rail and mobile drawer. */
export const navGroups: NavGroup[] = [
	{
		label: 'Discover',
		items: [
			{ href: '/discover', label: 'Discover', icon: 'discover' },
			{ href: '/library', label: 'Poetry Library', icon: 'library' }
		]
	},
	{
		label: 'My Space',
		items: [
			{ href: '/journal', label: 'My Journal', icon: 'journal', private: true },
			{ href: '/letters', label: 'Letters to Myself', icon: 'envelope', private: true },
			{ href: '/bookmarks', label: 'Bookmarks', icon: 'bookmark' }
		]
	},
	{
		label: 'Community',
		items: [
			{ href: '/community', label: 'Community', icon: 'community' },
			{ href: '/notifications', label: 'Notifications', icon: 'bell', badge: 'unread' },
			{ href: '/admin', label: 'Moderation', icon: 'shield', adminOnly: true }
		]
	},
	{
		label: 'Preferences',
		items: [
			{ href: '/account', label: 'Account', icon: 'account' },
			{ href: '/settings', label: 'Settings', icon: 'settings' }
		]
	}
];


export const isActive = (pathname: string, href: string) =>
	pathname === href || pathname.startsWith(href + '/');
