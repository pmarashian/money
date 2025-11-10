import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { searchUserTransactions } from '@/lib/redis/search';
import { getSearchCache, setSearchCache } from '@/lib/redis/cache';
import { CACHE_TTL } from '@/lib/redis/cache';
import { createPaginatedResult } from '@/utils/pagination';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);

    // Parse search parameters
    const query = searchParams.get('q') || '';
    const vendor = searchParams.get('vendor') || '';
    const category = searchParams.get('category') || '';
    const type = searchParams.get('type') || '';
    const minAmount = searchParams.get('minAmount') ? parseFloat(searchParams.get('minAmount')!) : undefined;
    const maxAmount = searchParams.get('maxAmount') ? parseFloat(searchParams.get('maxAmount')!) : undefined;
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = (searchParams.get('sortOrder') || 'DESC') as 'ASC' | 'DESC';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '25'), 100);

    // Create cache key
    const cacheKey = `${query}_${vendor}_${category}_${type}_${minAmount}_${maxAmount}_${startDate}_${endDate}_${sortBy}_${sortOrder}_${page}_${pageSize}`;

    // Check cache first
    const cachedResult = await getSearchCache(user.id, cacheKey);
    if (cachedResult) {
      return NextResponse.json(cachedResult);
    }

    // Perform search
    const searchOptions = {
      query: query || undefined,
      vendor: vendor || undefined,
      category: category || undefined,
      type: type || undefined,
      minAmount,
      maxAmount,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      sortBy,
      sortOrder,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    };

    const searchResult = await searchUserTransactions(user.id, searchOptions);

    // Create paginated response
    const paginatedResult = createPaginatedResult(
      searchResult.transactions,
      searchResult.totalCount,
      { page, pageSize }
    );

    const response = {
      ...paginatedResult,
      facets: searchResult.facets,
      query: {
        q: query,
        vendor,
        category,
        type,
        minAmount,
        maxAmount,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      },
    };

    // Cache the result
    await setSearchCache(user.id, cacheKey, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Search error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

// POST endpoint for advanced search with complex queries
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const {
      query,
      filters = {},
      sort = { by: 'date', order: 'DESC' },
      pagination = { page: 1, pageSize: 25 },
    } = body;

    // Build search options from filters
    const searchOptions = {
      query: query || undefined,
      vendor: filters.vendor || undefined,
      category: filters.category || undefined,
      type: filters.type || undefined,
      minAmount: filters.minAmount,
      maxAmount: filters.maxAmount,
      startDate: filters.startDate,
      endDate: filters.endDate,
      sortBy: sort.by || 'date',
      sortOrder: sort.order || 'DESC',
      limit: Math.min(pagination.pageSize || 25, 100),
      offset: ((pagination.page || 1) - 1) * (pagination.pageSize || 25),
    };

    const searchResult = await searchUserTransactions(user.id, searchOptions);

    const paginatedResult = createPaginatedResult(
      searchResult.transactions,
      searchResult.totalCount,
      { page: pagination.page || 1, pageSize: pagination.pageSize || 25 }
    );

    return NextResponse.json({
      ...paginatedResult,
      facets: searchResult.facets,
    });
  } catch (error) {
    console.error('Advanced search error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Advanced search failed' },
      { status: 500 }
    );
  }
}
