import {
  DeltaEventData,
  DoneEventData,
  ErrorEventData,
  MetaEventData,
  UsageEventData
} from '../../../shared/src/index.js';

export interface SseParserCallbacks {
  onMeta?: (data: MetaEventData) => void;
  onDelta?: (data: DeltaEventData) => void;
  onUsage?: (data: UsageEventData) => void;
  onDone?: (data: DoneEventData) => void;
  onError?: (data: ErrorEventData) => void;
}

export class SseParser {
  private buffer = '';
  private currentEventName = 'delta';

  constructor(private readonly callbacks: SseParserCallbacks) {}

  /**
   * Đẩy một chunk chuỗi ký tự nhận được từ HTTP stream vào parser.
   */
  feed(chunk: string): void {
    this.buffer += chunk;
    const lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop() || '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        // Dòng trống biểu thị kết thúc một event message, reset event name mặc định
        this.currentEventName = 'delta';
        continue;
      }

      if (line.startsWith('event:')) {
        this.currentEventName = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        const dataStr = line.slice(5).trim();
        this.dispatch(this.currentEventName, dataStr);
      }
    }
  }

  /**
   * Phân phối dữ liệu tới callback tương ứng dựa trên tên event.
   */
  private dispatch(eventName: string, dataStr: string): void {
    try {
      const parsed = JSON.parse(dataStr);
      switch (eventName) {
        case 'meta':
          this.callbacks.onMeta?.(parsed);
          break;
        case 'delta':
          this.callbacks.onDelta?.(parsed);
          break;
        case 'usage':
          this.callbacks.onUsage?.(parsed);
          break;
        case 'done':
          this.callbacks.onDone?.(parsed);
          break;
        case 'error':
          this.callbacks.onError?.(parsed);
          break;
        default:
          // Nếu event name lạ nhưng có text, xử lý như delta
          if (parsed && typeof parsed.text === 'string') {
            this.callbacks.onDelta?.(parsed);
          }
          break;
      }
    } catch {
      // Nếu dataStr không phải JSON thuần, gửi thô dưới dạng delta nếu là event delta
      if (eventName === 'delta' && dataStr) {
        this.callbacks.onDelta?.({ text: dataStr });
      }
    }
  }

  /**
   * Đóng stream và xử lý phần buffer còn sót lại.
   */
  end(): void {
    if (this.buffer.trim().startsWith('data:')) {
      const dataStr = this.buffer.trim().slice(5).trim();
      this.dispatch(this.currentEventName, dataStr);
    }
    this.buffer = '';
  }
}
