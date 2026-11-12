/**
 * Định nghĩa các biến môi trường và bindings của Cloudflare Worker.
 */
export interface Env {
  /**
   * Cloudflare Workers AI binding.
   */
  AI: {
    run: (model: string, input: Record<string, unknown>, options?: Record<string, unknown>) => Promise<any>;
  };

  /**
   * Khóa Bearer API key cấu hình qua wrangler secret put NESCODE_API_KEY.
   */
  NESCODE_API_KEY?: string;

  /**
   * Tên model mặc định (mặc định: @cf/zai-org/glm-4.7-flash).
   */
  DEFAULT_MODEL?: string;

  /**
   * Kích thước body tối đa (bytes) (mặc định: 262144 = 256 KiB).
   */
  MAX_BODY_BYTES?: string;

  /**
   * Giới hạn output tokens tối đa (mặc định: 1500).
   */
  MAX_OUTPUT_TOKENS?: string;

  /**
   * Bật hỗ trợ streaming Server-Sent Events (mặc định: true).
   */
  ENABLE_STREAMING?: string;
}
