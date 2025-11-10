// Pagination utilities
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function getPaginationOptions(options: PaginationOptions = {}) {
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.max(1, Math.min(100, options.pageSize || 25));

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
    limit: pageSize,
  };
}

export function createPaginatedResult<T>(
  data: T[],
  totalCount: number,
  options: PaginationOptions = {}
): PaginatedResult<T> {
  const { page, pageSize } = getPaginationOptions(options);
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

// Redis Search pagination helpers
export function getRedisSearchPagination(options: PaginationOptions = {}) {
  const { offset, limit } = getPaginationOptions(options);

  return {
    offset,
    limit,
    num: limit, // RedisSearch uses 'num' for limit
    cursor: offset, // Some Redis clients use 'cursor'
  };
}
