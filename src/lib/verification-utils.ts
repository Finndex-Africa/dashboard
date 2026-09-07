/** Helpers for ID verification admin review */

export function getVerificationUserType(verification: {
  userId?: string | { userType?: string } | null;
}): string | undefined {
  const user = verification.userId;
  if (typeof user === 'object' && user?.userType) {
    return user.userType;
  }
  return undefined;
}

/** Service providers and real estate agencies submit a business registration certificate. */
export function requiresBusinessRegistrationCertificate(userType?: string): boolean {
  return userType === 'service_provider' || userType === 'real_estate_agency';
}

export function shouldShowBusinessRegistrationSection(
  verification: {
    userId?: string | { userType?: string } | null;
    businessRegistrationCertificate?: string | null;
  },
): boolean {
  const userType = getVerificationUserType(verification);
  if (requiresBusinessRegistrationCertificate(userType)) {
    return true;
  }
  return Boolean(verification.businessRegistrationCertificate?.trim());
}

/**
 * The signed agent agreement is no longer collected. Show it only when a past
 * submission actually carries one — never as an outstanding requirement.
 */
export function shouldShowSignedAgentAgreementSection(
  verification: {
    signedAgentAgreement?: string | null;
  },
): boolean {
  return Boolean(verification.signedAgentAgreement?.trim());
}
