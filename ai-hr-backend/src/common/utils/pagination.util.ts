export function getPaginationParams(page = 1, pageSize = 20): { skip: number; take: number } {
  const skip = (page - 1) * pageSize;
  return { skip, take: pageSize };
}

export function buildOrderBy(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc'): Record<string, string> {
  if (!sortBy) return { createdAt: sortOrder };
  return { [sortBy]: sortOrder };
}
