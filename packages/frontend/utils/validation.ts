export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): {isValid: boolean, errors: string[]} => {
  const errors: string[] = [];
  // Password must be at least 8 characters long
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long.");
  }

  // Password must contain at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }

  // Password must contain at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter.");
  }

  // Password must contain at least one digit
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one digit.");
  }

  // Password must contain at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validatePhoneNumber = (phoneNumber: string): boolean => {
  const phoneNumberRegex = /^\d{10}$/; // Exactly 10 digits
  return phoneNumberRegex.test(phoneNumber);
};

// Accept either a full invite LINK (e.g. https://janata.app/i/ABC123) or a raw
// code. Returns the bare code so the UI can say "invite link" while the backend
// keeps receiving a code. No-op for an already-bare code.
export const extractInviteCode = (input: string): string => {
  const trimmed = (input ?? "").trim();
  const match = trimmed.match(/janata\.app\/i\/([^/?#\s]+)/i);
  return (match ? match[1] : trimmed).trim();
};