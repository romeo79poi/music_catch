// Robust API utility to handle fetch requests safely

export interface ApiRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function safeApiRequest<T = any>(
  url: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  const { method = "GET", headers = {}, body, timeout = 10000 } = options;

  try {
    // Set up request configuration
    const requestConfig: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    // Add body if provided
    if (body) {
      if (typeof body === "string") {
        requestConfig.body = body;
      } else {
        requestConfig.body = JSON.stringify(body);
      }
    }

    // Add timeout signal
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    requestConfig.signal = controller.signal;

    // Make the request
    const response = await fetch(url, requestConfig);
    clearTimeout(timeoutId);

    // Handle response
    return await parseResponse<T>(response);
  } catch (error: any) {
    console.error(`API request failed for ${url}:`, error);

    // Handle different types of errors
    if (error.name === "AbortError") {
      return {
        success: false,
        error: "Request timed out. Please try again.",
      };
    }

    if (error.name === "TypeError" && error.message.includes("fetch")) {
      return {
        success: false,
        error: "Network error. Please check your connection.",
      };
    }

    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.message,
        status: error.status,
      };
    }

    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const status = response.status;

  // Check if response has content
  const contentLength = response.headers.get("content-length");
  const contentType = response.headers.get("content-type") || "";

  let data: any = null;
  let parseError: string | null = null;

  // Try to parse response body safely - only read once
  try {
    // Check if the response body is already consumed
    if (response.bodyUsed) {
      console.warn("Response body already consumed, cannot parse");
      parseError = "Response body already consumed";
      data = null;
    } else if (contentLength === "0") {
      // Empty response
      data = null;
    } else {
      // Clone response to avoid "body already read" issues
      const responseClone = response.clone();

      if (contentType.includes("application/json")) {
        // Parse JSON response
        const text = await responseClone.text();
        if (text.trim()) {
          try {
            data = JSON.parse(text);
          } catch (jsonError) {
            console.error("JSON parse error:", jsonError);
            parseError = "Invalid JSON response";
            data = text; // Fallback to raw text
          }
        } else {
          data = null;
        }
      } else {
        // Get text response for non-JSON
        data = await responseClone.text();
      }
    }
  } catch (error: any) {
    console.error("Failed to parse response:", error);

    // Handle specific error types
    if (error.message?.includes("body stream already read") ||
        error.message?.includes("body used already") ||
        error.message?.includes("Already read")) {
      parseError = "Response body already consumed";
    } else {
      parseError = error.message || "Unable to read response";
    }

    // Don't try to read the response again, just set data to null
    data = null;
  }

  // Handle HTTP errors
  if (!response.ok) {
    let errorMessage = "";

    // If we have a parse error, use that
    if (parseError) {
      errorMessage = `Server error (${status}): ${parseError}`;
    } else {
      // Try to extract error from parsed data
      if (data && typeof data === "object") {
        errorMessage =
          data.message || data.error || data.detail || response.statusText;
      } else if (data && typeof data === "string") {
        errorMessage = data;
      } else {
        errorMessage = response.statusText || `HTTP ${status} Error`;
      }
    }

    return {
      success: false,
      error: errorMessage,
      status,
    };
  }

  // Success response - but check for parse errors
  if (parseError) {
    return {
      success: false,
      error: `Response parse error: ${parseError}`,
      status,
    };
  }

  return {
    success: true,
    data: data,
    status,
  };
}

// Convenience methods for common HTTP methods
export const apiGet = <T = any>(
  url: string,
  options: Omit<ApiRequestOptions, "method"> = {},
) => safeApiRequest<T>(url, { ...options, method: "GET" });

export const apiPost = <T = any>(
  url: string,
  body?: any,
  options: Omit<ApiRequestOptions, "method" | "body"> = {},
) => safeApiRequest<T>(url, { ...options, method: "POST", body });

export const apiPut = <T = any>(
  url: string,
  body?: any,
  options: Omit<ApiRequestOptions, "method" | "body"> = {},
) => safeApiRequest<T>(url, { ...options, method: "PUT", body });

export const apiDelete = <T = any>(
  url: string,
  options: Omit<ApiRequestOptions, "method"> = {},
) => safeApiRequest<T>(url, { ...options, method: "DELETE" });

// Auth-specific helper
export const authApiRequest = <T = any>(
  url: string,
  options: ApiRequestOptions = {},
) => {
  const token = localStorage.getItem("token");
  const headers = { ...options.headers };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return safeApiRequest<T>(url, { ...options, headers });
};

export default safeApiRequest;
