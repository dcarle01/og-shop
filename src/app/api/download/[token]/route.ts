// SHOP_src_app_api_download_[token]_route.ts
// Version: 1.0.0 | Created: 2026-01-28 | Author: Open Gateways Team
// Description: Secure file download handler with token validation

import { NextRequest, NextResponse } from 'next/server';
import { validateDownloadToken, incrementDownloadCount } from '@/lib/database';
import fs from 'fs';
import path from 'path';

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }
    
    // Validate the download token
    const validation = validateDownloadToken(token);
    
    if (!validation.valid || !validation.downloadToken) {
      console.log(`[Shop Download] Invalid token: ${token} - ${validation.error}`);
      return NextResponse.json(
        { error: validation.error || 'Invalid download token' },
        { status: 403 }
      );
    }
    
    const downloadToken = validation.downloadToken;
    
    // Get the file path
    const filePath = downloadToken.download_file_path;
    
    if (!filePath) {
      console.error(`[Shop Download] No file path for token: ${token}`);
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Resolve the absolute path
    // Files are expected to be in /home/dalecarl/public_html/assets/downloads/
    const possiblePaths = [
      path.join(process.cwd(), 'assets', 'downloads', filePath),
      path.join('/home/openga9/public_html/assets/downloads', filePath),
      filePath, // If already absolute
    ];
    
    let absolutePath: string | null = null;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        absolutePath = testPath;
        break;
      }
    }
    
    if (!absolutePath) {
      console.error(`[Shop Download] File not found: ${filePath}`);
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Read the file
    const fileBuffer = fs.readFileSync(absolutePath);
    const fileName = path.basename(filePath);
    
    // Determine content type based on file extension
    const ext = path.extname(fileName).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.mp3': 'audio/mpeg',
      '.m4a': 'audio/mp4',
      '.wav': 'audio/wav',
      '.flac': 'audio/flac',
      '.aac': 'audio/aac',
      '.ogg': 'audio/ogg',
      '.pdf': 'application/pdf',
      '.zip': 'application/zip',
      '.epub': 'application/epub+zip',
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    
    // Increment download count
    incrementDownloadCount(downloadToken.id);
    
    console.log(`[Shop Download] Serving file: ${fileName} for token: ${token}`);
    
    // Return the file
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Shop Download] Error:', error);
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    );
  }
}
