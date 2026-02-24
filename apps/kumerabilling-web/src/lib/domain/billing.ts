export function calculateNextPaymentDate(validatedAt: Date): Date {
  const year = validatedAt.getUTCFullYear();
  const month = validatedAt.getUTCMonth();
  const day = validatedAt.getUTCDate();

  if (day >= 28) {
    return new Date(Date.UTC(year, month + 2, 1, 12, 0, 0));
  }

  return new Date(Date.UTC(year, month + 1, day, 12, 0, 0));
}

export function isOverdue(now: Date, dueDate: Date): boolean {
  return now.getTime() > dueDate.getTime();
}

export function hasReachedGraceLimit(now: Date, dueDate: Date, graceDays = 7): boolean {
  const msPerDay = 24 * 60 * 60 * 1000;
  const elapsed = now.getTime() - dueDate.getTime();
  return elapsed >= graceDays * msPerDay;
}

export function isTokenExpired(expiresAt: Date, now: Date): boolean {
  return now.getTime() > expiresAt.getTime();
}
