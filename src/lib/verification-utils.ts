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

/** Individual agents submit a signed agent agreement (not real estate agencies). */
export function requiresSignedAgentAgreement(userType?: string): boolean {
  return userType === 'agent';
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

export function shouldShowSignedAgentAgreementSection(
  verification: {
    userId?: string | { userType?: string } | null;
    signedAgentAgreement?: string | null;
  },
): boolean {
  const userType = getVerificationUserType(verification);
  if (userType === 'real_estate_agency') {
    return false;
  }
  if (requiresSignedAgentAgreement(userType)) {
    return true;
  }
  return Boolean(verification.signedAgentAgreement?.trim());
}
