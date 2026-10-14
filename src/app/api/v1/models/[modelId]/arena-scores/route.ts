import { NextRequest, NextResponse } from 'next/server';

import { createLogger } from '@/src/lib/logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_DASH_BOARD_API_URL || '';
const API_KEY = process.env.NEXT_PUBLIC_DASH_BOARD_API_KEY || '';

const log = createLogger('/api/v1/models/[modelId]/arena-scores');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  const { modelId } = await params;

  // Parse modelId as number for the external API
  const modelIdNum = parseInt(modelId, 10);

  if (isNaN(modelIdNum)) {
    return NextResponse.json({ error: 'Invalid model ID' }, { status: 400 });
  }

  const upstreamParams = new URLSearchParams();
  const metric = request.nextUrl.searchParams.get('metric');
  if (metric) upstreamParams.append('metric', metric);

  const path = `/api/v1/models/${modelIdNum}/arena-scores${upstreamParams.toString() ? '?' + upstreamParams.toString() : ''}`;
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
        { error: 'Failed to fetch arena scores' },
        { status: response.status }
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    log.error('failed to fetch model arena scores', error);
    return NextResponse.json({ error: 'Failed to fetch arena scores' }, { status: 500 });
  }
}
