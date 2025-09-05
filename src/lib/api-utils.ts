/**
 * Safe JSON parsing utilities for API responses
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  diagnostic?: any
}

/**
 * Safely parse JSON response with comprehensive error handling
 */
export async function safeJsonParse<T = any>(
  response: Response,
  context: string = 'API'
): Promise<ApiResponse<T>> {
  const logPrefix = `🔄 [${context.toUpperCase()}]`
  
  console.log(`${logPrefix} Response status:`, response.status, response.statusText)
  
  try {
    // Check if response is ok
    if (!response.ok) {
      console.error(`❌ ${logPrefix} HTTP error:`, response.status, response.statusText)
      return {
        success: false,
        error: `Server error: ${response.status} ${response.statusText}`
      }
    }

    // Get response text first
    const responseText = await response.text()
    console.log(`${logPrefix} Raw response:`, responseText.substring(0, 500))
    
    // Check for empty response
    if (!responseText.trim()) {
      console.error(`❌ ${logPrefix} Empty response from server`)
      return {
        success: false,
        error: 'Empty response from server'
      }
    }
    
    // Try to parse JSON
    let result
    try {
      result = JSON.parse(responseText)
      console.log(`✅ ${logPrefix} Successfully parsed JSON:`, result)
    } catch (parseError) {
      console.error(`❌ ${logPrefix} Failed to parse JSON:`, parseError)
      console.error(`❌ ${logPrefix} Response text:`, responseText)
      return {
        success: false,
        error: 'Invalid JSON response from server',
        diagnostic: {
          parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error',
          responseText: responseText.substring(0, 200)
        }
      }
    }
    
    return result as ApiResponse<T>
  } catch (error) {
    console.error(`❌ ${logPrefix} Unexpected error:`, error)
    return {
      success: false,
      error: 'Unexpected error processing server response',
      diagnostic: {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    }
  }
}

/**
 * Make a safe API request with automatic error handling
 */
export async function safeApiRequest<T = any>(
  url: string,
  options: RequestInit = {},
  context: string = 'API'
): Promise<ApiResponse<T>> {
  const logPrefix = `🎯 [${context.toUpperCase()}]`
  
  try {
    console.log(`${logPrefix} Making request to:`, url, options.method || 'GET')
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
    
    return await safeJsonParse<T>(response, context)
  } catch (fetchError) {
    console.error(`❌ ${logPrefix} Fetch error:`, fetchError)
    return {
      success: false,
      error: 'Network error - please check your connection',
      diagnostic: {
        fetchError: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error',
        url,
        method: options.method || 'GET'
      }
    }
  }
}