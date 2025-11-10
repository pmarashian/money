import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { getSearchSuggestions } from '@/lib/redis/search';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('q') || '';
    const field = (searchParams.get('field') || 'vendor') as 'vendor' | 'description';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

    if (!prefix || prefix.length < 2) {
      return NextResponse.json({
        suggestions: [],
      });
    }

    const suggestions = await getSearchSuggestions(user.id, prefix, field);

    return NextResponse.json({
      suggestions: suggestions.slice(0, limit),
      field,
      prefix,
    });
  } catch (error) {
    console.error('Suggestions error:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}
