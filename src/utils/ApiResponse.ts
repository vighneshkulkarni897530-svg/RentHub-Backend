/**
 * Standardized success response envelope matching the frontend
 * `ApiResponse<T>` shape: { success, data, message? }.
 */
export class ApiResponse<T> {
  public success: boolean;
  public data: T;
  public message?: string;

  constructor(data: T, message?: string) {
    this.success = true;
    this.data = data;
    this.message = message;
  }

  static ok<T>(data: T, message?: string): ApiResponse<T> {
    return new ApiResponse(data, message);
  }
}

export default ApiResponse;

