/** Stroke icon paths from the design (24×24, 1.5 stroke). */
export const icons = {
	discover: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm3.5 5.5-2 5-5 2 2-5z',
	library:
		'M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z',
	journal: 'M5 3h14v18H5zM9 3v18M12 8h4M12 12h4',
	community:
		'M9 4.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20c-.5-2.6-2-4.4-4-5.2',
	bookmark: 'M6 4h12v16l-6-4-6 4z',
	account: 'M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 21c1-4 4-6 8-6s7 2 8 6',
	settings:
		'M4 7h10M18 7h2M4 17h4M12 17h8M16 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM10 15a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
	pen: 'M4 20l4-1 11-11-3-3L5 16zM14 6l3 3',
	lock: 'M5 11h14v9H5zM8 11V8a4 4 0 0 1 8 0v3',
	search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
	heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
	back: 'M19 12H5M11 6l-6 6 6 6',
	arrow: 'M5 12h14M13 6l6 6-6 6',
	flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
	shield: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z',
	bell: 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0',
	trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
	close: 'M6 6l12 12M18 6 6 18',
	logout: 'M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10'
} as const;

export type IconName = keyof typeof icons;
