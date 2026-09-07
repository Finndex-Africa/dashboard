export const BRAND_NAME = 'Findafriq';
export const ADMIN_EMAIL = 'findafriq@gmail.com';

function isLegacyBrandText(value?: string | null): boolean {
    return !!value && /finndex/i.test(value);
}

/** Map leftover Finndex Africa name/email values to Findafriq for display. */
export function applyBrandDisplay<
    T extends { firstName?: string; lastName?: string; email?: string; name?: string },
>(user: T): T {
    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    const nameIsLegacy = isLegacyBrandText(fullName) || isLegacyBrandText(user.name);
    const emailIsLegacy = isLegacyBrandText(user.email);

    if (!nameIsLegacy && !emailIsLegacy) return user;

    return {
        ...user,
        ...(nameIsLegacy ? { firstName: BRAND_NAME, lastName: '' } : {}),
        ...(nameIsLegacy && 'name' in user ? { name: BRAND_NAME } : {}),
        ...(emailIsLegacy ? { email: ADMIN_EMAIL } : {}),
    };
}

export function displayBrandName(firstName?: string, lastName?: string, fallback = BRAND_NAME): string {
    const full = `${firstName ?? ''} ${lastName ?? ''}`.trim();
    if (!full || isLegacyBrandText(full)) return fallback;
    return full;
}

export function displayBrandEmail(email?: string): string {
    if (!email || isLegacyBrandText(email)) return ADMIN_EMAIL;
    return email;
}
