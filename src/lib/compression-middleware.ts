import { NextRequest, NextResponse } from 'next/server'
import { gzip, deflate } from 'zlib'
import { promisify } from 'util'

const gzipAsync = promisify(gzip)
const deflateAsync = promisify(deflate)

// Response compression utilities
export class CompressionService {
  private static readonly MIN_COMPRESSION_SIZE = 1024 // 1KB minimum
  private static readonly COMPRESSION_LEVEL = 6 // Balanced compression level

  /**
   * Compress response data based on Accept-Encoding header
   */
  static async compressResponse(
    request: NextRequest,
    data: string | Buffer
  ): Promise<{
    compressedData: Buffer
    encoding: string | null
    originalSize: number
    compressedSize: number
    compressionRatio: number
  }> {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8')
    const originalSize = buffer.length

    // Skip compression for small payloads
    if (originalSize < this.MIN_COMPRESSION_SIZE) {
      return {
        compressedData: buffer,
        encoding: null,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1
      }
    }

    const acceptEncoding = request.headers.get('accept-encoding') || ''
    
    let compressedData: Buffer
    let encoding: string | null = null

    try {
      if (acceptEncoding.includes('gzip')) {
        compressedData = await gzipAsync(buffer, { level: this.COMPRESSION_LEVEL })
        encoding = 'gzip'
      } else if (acceptEncoding.includes('deflate')) {
        compressedData = await deflateAsync(buffer, { level: this.COMPRESSION_LEVEL })
        encoding = 'deflate'
      } else {
        compressedData = buffer
      }

      const compressedSize = compressedData.length
      const compressionRatio = originalSize / compressedSize

      console.log(`📦 Compression: ${originalSize}B → ${compressedSize}B (${compressionRatio.toFixed(2)}x, ${encoding || 'none'})`)

      return {
        compressedData,
        encoding,
        originalSize,
        compressedSize,
        compressionRatio
      }
    } catch (error) {
      console.error('❌ Compression failed:', error)
      return {
        compressedData: buffer,
        encoding: null,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1
      }
    }
  }

  /**
   * Create compressed NextResponse
   */
  static async createCompressedResponse(
    request: NextRequest,
    data: any,
    options: {
      status?: number
      headers?: HeadersInit
      contentType?: string
    } = {}
  ): Promise<NextResponse> {
    const jsonData = typeof data === 'string' ? data : JSON.stringify(data)
    const compressed = await this.compressResponse(request, jsonData)
    
    const headers = new Headers(options.headers)
    headers.set('Content-Type', options.contentType || 'application/json')
    headers.set('Content-Length', compressed.compressedSize.toString())
    
    if (compressed.encoding) {
      headers.set('Content-Encoding', compressed.encoding)
    }

    // Add performance headers
    headers.set('X-Original-Size', compressed.originalSize.toString())
    headers.set('X-Compressed-Size', compressed.compressedSize.toString())
    headers.set('X-Compression-Ratio', compressed.compressionRatio.toFixed(2))

    return new NextResponse(compressed.compressedData as BodyInit, {
      status: options.status || 200,
      headers
    })
  }
}

// Middleware wrapper for automatic compression
export function withCompression<T extends any[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const response = await handler(req, ...args)
    
    // Check if response should be compressed
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json') && !contentType?.includes('text/')) {
      return response
    }

    // Get response body
    const body = await response.text()
    if (!body) {
      return response
    }

    // Create compressed response
    return CompressionService.createCompressedResponse(req, body, {
      status: response.status,
      headers: response.headers,
      contentType: contentType || 'application/json'
    })
  }
}