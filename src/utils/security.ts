export interface PasswordRequirements {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export interface PasswordAnalysis {
  score: number; // 0 to 100
  label: 'Muito Fraca' | 'Fraca' | 'Média' | 'Forte' | 'Excelente';
  color: string;
  requirements: PasswordRequirements;
}

export function evaluatePasswordStrength(password: string): PasswordAnalysis {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  const requirements: PasswordRequirements = {
    minLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
  };

  let pts = 0;
  if (password.length >= 8) pts += 20;
  if (password.length >= 12) pts += 20;
  if (hasUpper) pts += 15;
  if (hasLower) pts += 15;
  if (hasNumber) pts += 15;
  if (hasSpecial) pts += 15;

  let label: PasswordAnalysis['label'] = 'Muito Fraca';
  let color = 'text-red-500';

  if (pts >= 90) {
    label = 'Excelente';
    color = 'text-emerald-400';
  } else if (pts >= 70) {
    label = 'Forte';
    color = 'text-[#D4AF37]';
  } else if (pts >= 50) {
    label = 'Média';
    color = 'text-yellow-400';
  } else if (pts >= 30) {
    label = 'Fraca';
    color = 'text-orange-400';
  }

  return {
    score: Math.min(100, pts),
    label,
    color,
    requirements,
  };
}

export function generateStrongPassword(length: number = 16): string {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = uppers + lowers + numbers + symbols;

  // Guarantee at least one of each required character type
  let result = [
    uppers[Math.floor(Math.random() * uppers.length)],
    lowers[Math.floor(Math.random() * lowers.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  for (let i = result.length; i < length; i++) {
    result.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Shuffle the array
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
}
