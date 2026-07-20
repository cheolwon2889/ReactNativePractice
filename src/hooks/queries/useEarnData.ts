import { useQuery } from '@tanstack/react-query';
import { fetchBinanceEarnDirectly } from '../../api/binanceDirect';
import { EarnProduct, ExchangeName } from '../../types/earn';

// 특정 문자열(코인 심볼, 거래소 등) 조합으로 변하지 않는 고정 이자율 편차를 만들어주는 헬퍼 함수
const getDeterministicOffset = (symbol: string, exchange: string, type: string): number => {
  let hash = 0;
  const str = symbol + exchange + type;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // -1.8% ~ +1.8% 사이의 일정한 편차 값을 리턴
  return ((Math.abs(hash) % 36) - 18) / 10;
};

/**
 * 바이낸스 API 데이터에 기반하여 바이비트, OKX, 업비트의 스테이킹 데이터를 가상으로 생성 및 합성합니다.
 */
const fetchAllEarnData = async (): Promise<EarnProduct[]> => {
  // 1. 실시간 바이낸스 데이터 조회
  const binanceData = await fetchBinanceEarnDirectly();

  const allProducts: EarnProduct[] = [...binanceData];

  // 2. 바이낸스 데이터를 가공해 Bybit, OKX, Upbit 데이터 합성
  binanceData.forEach((binanceItem) => {
    // Bybit & OKX 가상 상품 생성 (대부분의 코인 지원)
    const otherExchanges: ExchangeName[] = ['Bybit', 'OKX'];
    
    otherExchanges.forEach((ex) => {
      const offset = getDeterministicOffset(binanceItem.coinSymbol, ex, binanceItem.type);
      const calculatedApy = Math.max(0.5, parseFloat((binanceItem.apy + offset).toFixed(2)));
      
      allProducts.push({
        id: `${ex.toLowerCase()}-${binanceItem.coinSymbol.toLowerCase()}-${binanceItem.type}-${binanceItem.durationDays || 'flexible'}`,
        exchange: ex,
        coinSymbol: binanceItem.coinSymbol,
        apy: calculatedApy,
        type: binanceItem.type,
        durationDays: binanceItem.durationDays,
        minAmount: parseFloat((binanceItem.minAmount * (0.8 + Math.abs(offset) * 0.1)).toFixed(4)),
        maxAmount: binanceItem.maxAmount ? Math.round(binanceItem.maxAmount * (0.9 + offset * 0.05)) : undefined,
      });
    });

    // Upbit 가상 상품 생성 (원화 마켓 주요 스테이킹 코인 대상: ETH, SOL, ADA 등)
    const upbitSupportedCoins = ['ETH', 'SOL', 'ADA', 'ATOM', 'DOT'];
    if (upbitSupportedCoins.includes(binanceItem.coinSymbol)) {
      const ex: ExchangeName = 'Upbit';
      const offset = getDeterministicOffset(binanceItem.coinSymbol, ex, 'fixed'); // 업비트는 주로 고정식/지정위임형
      const calculatedApy = Math.max(0.5, parseFloat((binanceItem.apy * 0.8 + offset).toFixed(2))); // 업비트는 이율이 비교적 보수적
      
      allProducts.push({
        id: `upbit-${binanceItem.coinSymbol.toLowerCase()}-fixed-staking-${binanceItem.durationDays || 'flexible'}`,
        exchange: ex,
        coinSymbol: binanceItem.coinSymbol,
        apy: calculatedApy,
        type: 'fixed',
        durationDays: 30, // 기본 30일 예치/위임 가정
        minAmount: parseFloat((binanceItem.minAmount * 1.5).toFixed(4)),
        maxAmount: binanceItem.maxAmount ? Math.round(binanceItem.maxAmount * 0.5) : undefined,
      });
    }
  });

  return allProducts;
};

/**
 * 모든 거래소의 스테이킹 데이터를 불러오고 메모리에 캐싱하는 React Query 커스텀 훅입니다.
 */
export const useStakingData = () => {
  return useQuery({
    queryKey: ['earnProducts', 'all-exchanges'], 
    queryFn: fetchAllEarnData, 
    staleTime: 1000 * 60 * 5, 
    gcTime: 1000 * 60 * 30, 
    retry: 2, 
  });
};

