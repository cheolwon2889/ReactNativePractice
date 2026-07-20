export type EarnDuration = 'flexible' | 'fixed';
export type ExchangeName = 'Binance' | 'Bybit' | 'OKX' | 'Upbit';

export interface EarnProduct {
  id: string; // 고유 식별자 (예: 'binance-btc-flexible')
  exchange: ExchangeName; // 거래소 이름
  coinSymbol: string; // 코인 심볼 (ex. 'BTC', 'USDT')
  apy: number; // 연간 수익률 (Annual Percentage Yield)
  type: EarnDuration; // 자유/고정 예치 여부
  durationDays?: number; // 고정 예치일 경우 기간 (예: 30, 60, 90)
  minAmount: number; // 최소 예치 가능 수량
  maxAmount?: number; // 최대 예치 가능 한도 수량 (선택 사항)
}
