import { NextRequest, NextResponse } from 'next/server';

import { createLogger } from '@/src/lib/logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_DASH_BOARD_API_URL || '';
const API_KEY = process.env.NEXT_PUBLIC_DASH_BOARD_API_KEY || '';

const log = createLogger('/api/v1/models/mase-30d-history');

export async function GET(request: NextRequest) {
  const params = new URLSearchParams();
  request.nextUrl.searchParams.forEach((value, key) => {
    params.append(key, value);
  });

  const path = `/api/v1/models/mase-30d-history${params.toString() ? '?' + params.toString() : ''}`;
  const url = `${API_BASE_URL}${path}`;

  log.debug(`upstream GET ${path}`);

  try {
    const response = await fetch(url, {
      headers: {
        'X-API-Key': API_KEY,
      }
    });

    if (!response.ok) {
      log.error(`upstream ${response.status} on ${path}`, (await response.text()).slice(0, 500));
      return NextResponse.json(
        { error: 'Failed to fetch the MASE history' },
        { status: response.status }
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    log.error('failed to fetch the MASE history', error);
    return NextResponse.json(
      { error: 'Failed to fetch the MASE history' },
      { status: 500 }
    );
  }
}
