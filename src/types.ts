export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: number;
  label?: string;
}

export type ActiveTab = 'capture' | 'qr' | 'gallery';
