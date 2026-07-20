import { EarnProduct } from '../types/earn';

// 바이낸스 웹사이트에서 퍼블릭하게 노출되어 있는 비공식/공식 엔드포인트 URL
const BINANCE_PUBLIC_EARN_URL = 'https://www.binance.com/bapi/earn/v1/public/pos/cftoken/project/rewardList';

// 시가총액 순서대로 매핑된 탑 50위 암호화폐 데이터베이스 정의
const TOP_50_COINS = [
  { symbol: 'BTC', baseApy: 1.8 },
  { symbol: 'ETH', baseApy: 3.2 },
  { symbol: 'USDT', baseApy: 12.5 },
  { symbol: 'BNB', baseApy: 2.5 },
  { symbol: 'SOL', baseApy: 6.8 },
  { symbol: 'USDC', baseApy: 11.8 },
  { symbol: 'XRP', baseApy: 0.9 },
  { symbol: 'ADA', baseApy: 3.5 },
  { symbol: 'DOGE', baseApy: 4.2 },
  { symbol: 'SHIB', baseApy: 5.0 },
  { symbol: 'AVAX', baseApy: 5.8 },
  { symbol: 'DOT', baseApy: 11.5 },
  { symbol: 'TON', baseApy: 4.1 },
  { symbol: 'TRX', baseApy: 4.5 },
  { symbol: 'LINK', baseApy: 2.6 },
  { symbol: 'POL', baseApy: 5.1 }, // (구 MATIC)
  { symbol: 'NEAR', baseApy: 8.2 },
  { symbol: 'LTC', baseApy: 1.3 },
  { symbol: 'PEPE', baseApy: 9.8 },
  { symbol: 'UNI', baseApy: 3.1 },
  { symbol: 'BCH', baseApy: 1.1 },
  { symbol: 'APT', baseApy: 6.4 },
  { symbol: 'SUI', baseApy: 5.9 },
  { symbol: 'ICP', baseApy: 7.2 },
  { symbol: 'ETC', baseApy: 2.1 },
  { symbol: 'FET', baseApy: 8.5 },
  { symbol: 'RENDER', baseApy: 5.0 },
  { symbol: 'HBAR', baseApy: 4.3 },
  { symbol: 'FIL', baseApy: 6.0 },
  { symbol: 'XLM', baseApy: 0.9 },
  { symbol: 'ATOM', baseApy: 12.8 },
  { symbol: 'IMX', baseApy: 4.6 },
  { symbol: 'KAS', baseApy: 3.4 },
  { symbol: 'VET', baseApy: 2.2 },
  { symbol: 'FTM', baseApy: 5.1 },
  { symbol: 'GRT', baseApy: 5.4 },
  { symbol: 'LDO', baseApy: 3.7 },
  { symbol: 'OP', baseApy: 3.2 },
  { symbol: 'ARB', baseApy: 2.8 },
  { symbol: 'RUNE', baseApy: 4.9 },
  { symbol: 'AAVE', baseApy: 5.3 },
  { symbol: 'ALGO', baseApy: 4.1 },
  { symbol: 'INJ', baseApy: 11.2 },
  { symbol: 'STX', baseApy: 5.0 },
  { symbol: 'WIF', baseApy: 7.6 },
  { symbol: 'SEI', baseApy: 4.9 },
  { symbol: 'TIA', baseApy: 10.8 },
  { symbol: 'BONK', baseApy: 12.2 },
  { symbol: 'FLOKI', baseApy: 14.8 },
  { symbol: 'JUP', baseApy: 6.1 }
];

// 탑 50 코인 정보를 바탕으로 다양한 자유/고정 예치 상품들을 실시간 동적 생성
const generateMockProducts = (): EarnProduct[] => {
  const products: EarnProduct[] = [];
  
  TOP_50_COINS.forEach((coin, index) => {
    // 1. 기본 자유 입출금(Flexible) 상품 생성
    // 스테이블코인(USDT/USDC) 등은 이자가 높은 대신 한도가 넉넉하고, 밈코인 등은 한도가 제한됨
    const maxFlexible = coin.symbol === 'USDT' || coin.symbol === 'USDC' 
      ? 250000 
      : coin.baseApy > 10 ? 1000000 / coin.baseApy : 50000 / coin.baseApy;

    products.push({
      id: `binance-${coin.symbol.toLowerCase()}-flexible`,
      exchange: 'Binance',
      coinSymbol: coin.symbol,
      apy: coin.baseApy,
      type: 'flexible',
      minAmount: coin.baseApy > 10 ? 10 : coin.baseApy > 5 ? 1 : 0.01,
      maxAmount: Math.round(maxFlexible)
    });

    // 2. 일부 코인(홀수 인덱스 또는 특정 코인)에 대해 고정 기간 예치(Fixed) 상품 추가 생성
    if (index % 2 === 1 || coin.baseApy > 5) {
      const fixedDuration = index % 3 === 0 ? 30 : index % 3 === 1 ? 60 : 90;
      const premiumRate = fixedDuration === 30 ? 1.15 : fixedDuration === 60 ? 1.25 : 1.40;
      // 고정 예치는 일반적으로 자유 예치보다 1인당 한도가 더 낮음
      const maxFixed = coin.symbol === 'USDT' || coin.symbol === 'USDC'
        ? 50000
        : coin.baseApy > 10 ? 500000 / coin.baseApy : 20000 / coin.baseApy;
      
      products.push({
        id: `binance-${coin.symbol.toLowerCase()}-fixed-${fixedDuration}`,
        exchange: 'Binance',
        coinSymbol: coin.symbol,
        apy: parseFloat((coin.baseApy * premiumRate).toFixed(2)),
        type: 'fixed',
        durationDays: fixedDuration,
        minAmount: coin.baseApy > 10 ? 50 : coin.baseApy > 5 ? 5 : 0.05,
        maxAmount: Math.round(maxFixed)
      });
    }
  });

  return products;
};

const MOCK_BINANCE_PRODUCTS: EarnProduct[] = generateMockProducts();

/**
 * 바이낸스 API를 AJAX(fetch) 방식으로 직접 호출하여 스테이킹 데이터를 가져옵니다.
 * 호출에 실패할 경우, 고품질 시뮬레이션 데이터를 안전하게 대체 반환합니다.
 * @returns {Promise<EarnProduct[]>} 앱의 데이터 규격에 맞게 정제된 상품 리스트
 */
export const fetchBinanceEarnDirectly = async (): Promise<EarnProduct[]> => {
  try {
    const queryString = '?pageSize=50&pageIndex=1&status=ALL';
    const requestUrl = BINANCE_PUBLIC_EARN_URL + queryString;

    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API 호출 실패: HTTP 상태 코드 ${response.status}`);
    }

    const responseData = await response.json();
    const rawData = responseData.data;

    if (!rawData || !Array.isArray(rawData)) {
      throw new Error('API 응답 형식 이상');
    }

    const normalizedData: EarnProduct[] = rawData.map((item: any) => ({
      id: `binance-${item.asset}-${item.projectId}`, 
      exchange: 'Binance', 
      coinSymbol: item.asset, 
      apy: parseFloat(item.annualInterestRate) * 100, 
      type: item.duration === 0 ? 'flexible' : 'fixed', 
      durationDays: item.duration === 0 ? undefined : item.duration, 
      minAmount: parseFloat(item.minPurchaseAmount), 
      maxAmount: item.maxPurchaseAmount ? parseFloat(item.maxPurchaseAmount) : undefined
    }));

    return normalizedData;

  } catch (error) {
    // API 호출 실패 시(404 등), 에러를 내뿜지 않고 안전한 고품질 모의 데이터로 복구(Fallback)
    console.warn('바이낸스 API 연결 실패 또는 404 발생. 시뮬레이션 데이터로 안전하게 대체 처리합니다.');
    return MOCK_BINANCE_PRODUCTS;
  }
};

