// SHOP_src_app_assets_[...path]_route.ts
// Version: 1.0.1 | Created: 2026-01-28 | Last Modified: 2026-10-09 | Author: Open Gateways Team
// Description: Serve shared assets through Next.js (bypasses Passenger issue)

import { NextRequest, NextResponse } from 'next/server';
import { readFile, realpath } from 'fs/promises';
import path from 'path';

// Only these top-level folders under assets/ are public (allow-list, 2026-10-09).
const ALLOWED_TOP_LEVEL = new Set(['images', 'fonts', 'manifests']);

// Simple MIME type lookup
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.pdf': 'application/pdf',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;

    // Serve only the public asset folders. assets/ is shared with other content
    // (database/, data/, api/, downloads/, lib/ ...). Anything outside the allowed
    // folders, and any dot-file or dot-folder segment, gets a 404. Same rule as
    // the schedule and admin /api/assets routes (2026-10-08).
    if (
      pathSegments.length < 2 ||
      !ALLOWED_TOP_LEVEL.has(pathSegments[0]) ||
      pathSegments.some(seg => seg.startsWith('.') || seg.includes('/') || seg.includes('\\'))
    ) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Resolve the path strictly inside assets/ (the old startsWith check had no
    // trailing separator), then require the real file - symlinks resolved - to
    // sit inside the real allowed folder.
    const assetsDir = path.resolve(process.cwd(), 'assets');
    const filePath = path.resolve(assetsDir, ...pathSegments);
    if (!filePath.startsWith(assetsDir + path.sep)) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }
    let realFile: string;
    try {
      const realAllowedDir = path.join(await realpath(assetsDir), pathSegments[0]);
      realFile = await realpath(filePath);
      if (!realFile.startsWith(realAllowedDir + path.sep)) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
      }
    } catch {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Read and serve the file
    const fileBuffer = await readFile(realFile);
    const mimeType = getMimeType(realFile);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
