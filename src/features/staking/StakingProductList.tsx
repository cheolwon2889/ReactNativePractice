import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator 
} from 'react-native';
import { useStakingData } from '../../hooks/queries/useEarnData';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import { EarnProduct } from '../../types/earn';

interface StakingProductListProps {
  onSelectProductForSimulation: (coinSymbol: string, apy: string, maxAmount?: number) => void;
}

const COIN_RANK_ORDER = [
  'BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'USDC', 'XRP', 'ADA', 'DOGE', 'SHIB',
  'AVAX', 'DOT', 'TON', 'TRX', 'LINK', 'POL', 'NEAR', 'LTC', 'PEPE', 'UNI',
  'BCH', 'APT', 'SUI', 'ICP', 'ETC', 'FET', 'RENDER', 'HBAR', 'FIL', 'XLM',
  'ATOM', 'IMX', 'KAS', 'VET', 'FTM', 'GRT', 'LDO', 'OP', 'ARB', 'RUNE',
  'AAVE', 'ALGO', 'INJ', 'STX', 'WIF', 'SEI', 'TIA', 'BONK', 'FLOKI', 'JUP'
];

export const StakingProductList: React.FC<StakingProductListProps> = ({ 
  onSelectProductForSimulation 
}) => {
  const { data: products, isLoading, isError, refetch } = useStakingData();
  const { addBookmark, removeBookmark, isBookmarked } = useWatchlistStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'flexible' | 'fixed'>('all');
  const [sortBy, setSortBy] = useState<'marketCap' | 'highestApy' | 'alphabetical'>('marketCap');
  const [expandedCoin, setExpandedCoin] = useState<string | null>(null);

  // 1. 검색 및 필터링 적용
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter((p) => {
      const matchesSearch = p.coinSymbol.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedTypeFilter === 'all' || p.type === selectedTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [products, searchQuery, selectedTypeFilter]);

  // 2. 코인 심볼별로 그룹화 (여러 거래소의 APY 비교를 위함)
  const groupedProducts = useMemo(() => {
    const groups: { [symbol: string]: EarnProduct[] } = {};
    
    filteredProducts.forEach((p) => {
      if (!groups[p.coinSymbol]) {
        groups[p.coinSymbol] = [];
      }
      groups[p.coinSymbol].push(p);
    });

    // 각 코인 그룹 내에서 APY 기준 내림차순 정렬 (가장 높은 이자율이 맨 위에 오도록)
    Object.keys(groups).forEach((symbol) => {
      groups[symbol].sort((a, b) => b.apy - a.apy);
    });

    return groups;
  }, [filteredProducts]);

  // 목록에 렌더링될 고유 코인 리스트 (정렬 조건 반영 및 선택된 코인 제외)
  const coinSymbols = useMemo(() => {
    const symbols = Object.keys(groupedProducts);
    
    // 선택된 코인은 하단 리스트에서 제외하여 상단 고정 영역과의 중복을 방지합니다.
    const filteredSymbols = symbols.filter(s => s !== expandedCoin);
    
    if (sortBy === 'alphabetical') {
      return filteredSymbols.sort();
    } else if (sortBy === 'highestApy') {
      // 각 코인 그룹의 최상단 상품(최고 이율) APY 기준 내림차순 정렬
      return filteredSymbols.sort((a, b) => {
        const aMax = groupedProducts[a][0]?.apy || 0;
        const bMax = groupedProducts[b][0]?.apy || 0;
        return bMax - aMax;
      });
    } else {
      // marketCap: COIN_RANK_ORDER 시가총액 배열 인덱스 순 정렬
      return filteredSymbols.sort((a, b) => {
        const aIndex = COIN_RANK_ORDER.indexOf(a);
        const bIndex = COIN_RANK_ORDER.indexOf(b);
        const rankA = aIndex === -1 ? 999 : aIndex;
        const rankB = bIndex === -1 ? 999 : bIndex;
        return rankA - rankB;
      });
    }
  }, [groupedProducts, sortBy, expandedCoin]);

  const handleToggleExpand = (symbol: string) => {
    setExpandedCoin(expandedCoin === symbol ? null : symbol);
  };

  const getExchangeColor = (exchange: string) => {
    switch (exchange) {
      case 'Binance': return '#F3BA2F'; // 바이낸스 시그니처 옐로우
      case 'Bybit': return '#FFA500'; // 바이비트 오렌지
      case 'OKX': return '#000000'; // OKX 블랙 (테두리 처리용)
      case 'Upbit': return '#093687'; // 업비트 블루
      default: return '#888888';
    }
  };

  const getExchangeBgColor = (exchange: string) => {
    switch (exchange) {
      case 'Binance': return 'rgba(243, 186, 47, 0.15)';
      case 'Bybit': return 'rgba(255, 165, 0, 0.15)';
      case 'OKX': return 'rgba(255, 255, 255, 0.1)';
      case 'Upbit': return 'rgba(9, 54, 135, 0.15)';
      default: return 'rgba(128, 128, 128, 0.15)';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4ADE80" />
        <Text style={styles.infoText}>실시간 거래소 이자율 데이터를 불러오는 중...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>데이터 로드 중 에러가 발생했습니다.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 타이틀, 검색, 필터, 정렬, 상세 비교 패널을 포함하는 헤더 렌더링 함수
  const renderHeader = () => {
    return (
      <View>
        <Text style={styles.title}>거래소별 예치 상품 비교 📊</Text>

        {/* 검색 바 */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="코인 검색 (예: USDT, BTC, SOL)"
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* 필터 탭 */}
        <View style={styles.filterContainer}>
          {(['all', 'flexible', 'fixed'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                selectedTypeFilter === filter && styles.activeFilterTab
              ]}
              onPress={() => setSelectedTypeFilter(filter)}
            >
              <Text style={[
                styles.filterText,
                selectedTypeFilter === filter && styles.activeFilterText
              ]}>
                {filter === 'all' ? '전체' : filter === 'flexible' ? '자유 예치' : '고정 예치'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 정렬 조건 선택 */}
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>정렬 기준:</Text>
          <View style={styles.sortTabsRow}>
            {(['marketCap', 'highestApy', 'alphabetical'] as const).map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.sortTab,
                  sortBy === option && styles.activeSortTab
                ]}
                onPress={() => setSortBy(option)}
              >
                <Text style={[
                  styles.sortTabText,
                  sortBy === option && styles.activeSortTabText
                ]}>
                  {option === 'marketCap' ? '시총순' : option === 'highestApy' ? '최고 금리순' : '이름순'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 선택된 코인 요약 카드 및 상세 비교 테이블 고정 영역 (정렬 바로 아래) */}
        {expandedCoin && groupedProducts[expandedCoin] && (() => {
          const exchangeProducts = groupedProducts[expandedCoin];
          const highestProduct = exchangeProducts[0];

          return (
            <View style={styles.selectedCoinContainer}>
              {/* 선택된 코인 카드 (클릭 시 닫힘/선택 해제) */}
              <TouchableOpacity 
                style={[
                  styles.coinCard,
                  styles.coinCardSelectedHeader
                ]} 
                onPress={() => setExpandedCoin(null)}
                activeOpacity={0.7}
              >
                <View style={styles.coinInfo}>
                  <View style={[styles.coinIcon, { backgroundColor: getExchangeBgColor(highestProduct.exchange) }]}>
                    <Text style={[styles.coinIconText, { color: getExchangeColor(highestProduct.exchange) === '#000000' ? '#FFF' : getExchangeColor(highestProduct.exchange) }]}>
                      {expandedCoin[0]}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.coinSymbolText}>{expandedCoin}</Text>
                    <Text style={styles.exchangeCountText}>
                      {exchangeProducts.length}개 거래소 비교 중 (탭해서 닫기)
                    </Text>
                  </View>
                </View>

                <View style={styles.highestApyInfo}>
                  <Text style={styles.apyLabel}>최고 APY</Text>
                  <Text style={styles.highestApyText}>{highestProduct.apy.toFixed(2)}%</Text>
                  <Text style={styles.highestExchangeText}>({highestProduct.exchange})</Text>
                </View>
              </TouchableOpacity>

              {/* 카드 바로 밑에 일체형으로 붙는 상세 비교 테이블 */}
              <View style={styles.topComparisonPanel}>
                <Text style={styles.detailsTitle}>거래소별 상세 이자율 비교</Text>
                {exchangeProducts.map((p) => {
                  const bookmarked = isBookmarked(p.id);

                  return (
                    <View key={p.id} style={styles.exchangeRow}>
                      <View style={styles.exchangeRowLeft}>
                        <View style={[
                          styles.exchangeBadge, 
                          { 
                            backgroundColor: getExchangeBgColor(p.exchange),
                            borderColor: getExchangeColor(p.exchange),
                            borderWidth: p.exchange === 'OKX' ? 1 : 0
                          }
                        ]}>
                          <Text style={[
                            styles.exchangeBadgeText, 
                            { color: p.exchange === 'OKX' ? '#FFF' : getExchangeColor(p.exchange) }
                          ]}>
                            {p.exchange}
                          </Text>
                        </View>
                        <View style={styles.typeInfo}>
                          <Text style={styles.typeText}>
                            {p.type === 'flexible' ? '자유입출금' : `${p.durationDays}일 고정`}
                          </Text>
                          <Text style={styles.minAmountText}>
                            최소: {p.minAmount} {p.coinSymbol}{'\n'}최대: {p.maxAmount ? p.maxAmount.toLocaleString() : '무제한'} {p.coinSymbol}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.exchangeRowRight}>
                        <Text style={styles.apyValueText}>{p.apy.toFixed(2)}%</Text>
                        
                        <View style={styles.actionButtons}>
                          {/* 북마크 토글 */}
                          <TouchableOpacity 
                            style={[styles.actionIconButton, bookmarked && styles.bookmarkedActiveButton]}
                            onPress={() => bookmarked ? removeBookmark(p.id) : addBookmark(p)}
                          >
                            <Text style={styles.actionIconText}>{bookmarked ? '★' : '☆'}</Text>
                          </TouchableOpacity>

                          {/* 계산기 연동 */}
                          <TouchableOpacity 
                            style={styles.simulateButton}
                            onPress={() => onSelectProductForSimulation(p.coinSymbol, p.apy.toString(), p.maxAmount)}
                          >
                            <Text style={styles.simulateButtonText}>계산기</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })()}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4ADE80" />
        <Text style={styles.infoText}>실시간 거래소 이자율 데이터를 불러오는 중...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>데이터 로드 중 에러가 발생했습니다.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {coinSymbols.length === 0 && !expandedCoin ? (
        <View style={styles.emptyContainer}>
          {renderHeader()}
          <Text style={styles.infoText}>검색 결과에 맞는 스테이킹 상품이 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          data={coinSymbols}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          renderItem={({ item: symbol }) => {
            const exchangeProducts = groupedProducts[symbol];
            const highestProduct = exchangeProducts[0]; // 정렬되어 있으므로 첫 아이템이 최고 금리

            return (
              <TouchableOpacity 
                style={styles.coinCard} 
                onPress={() => handleToggleExpand(symbol)}
                activeOpacity={0.7}
              >
                <View style={styles.coinInfo}>
                  <View style={[styles.coinIcon, { backgroundColor: getExchangeBgColor(highestProduct.exchange) }]}>
                    <Text style={[styles.coinIconText, { color: getExchangeColor(highestProduct.exchange) === '#000000' ? '#FFF' : getExchangeColor(highestProduct.exchange) }]}>
                      {symbol[0]}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.coinSymbolText}>{symbol}</Text>
                    <Text style={styles.exchangeCountText}>
                      {exchangeProducts.length}개 거래소 비교 가능
                    </Text>
                  </View>
                </View>

                <View style={styles.highestApyInfo}>
                  <Text style={styles.apyLabel}>최고 APY</Text>
                  <Text style={styles.highestApyText}>{highestProduct.apy.toFixed(2)}%</Text>
                  <Text style={styles.highestExchangeText}>({highestProduct.exchange})</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  activeFilterTab: {
    backgroundColor: '#4ADE80',
    borderColor: '#4ADE80',
  },
  filterText: {
    color: '#888888',
    fontWeight: '600',
    fontSize: 14,
  },
  activeFilterText: {
    color: '#000000',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
    justifyContent: 'space-between',
  },
  sortLabel: {
    color: '#888888',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
  },
  sortTabsRow: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
    gap: 6,
  },
  sortTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#1E1E1E',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  activeSortTab: {
    backgroundColor: '#2D2D2D',
    borderColor: '#4ADE80',
  },
  sortTabText: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '600',
  },
  activeSortTabText: {
    color: '#4ADE80',
  },
  listContent: {
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#121212',
  },
  emptyContainer: {
    marginTop: 80,
    alignItems: 'center',
  },
  infoText: {
    color: '#888888',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4ADE80',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 15,
  },
  selectedCoinContainer: {
    marginBottom: 16,
  },
  coinCardSelectedHeader: {
    borderColor: '#4ADE80',
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
    backgroundColor: 'rgba(74, 222, 128, 0.04)',
  },
  topComparisonPanel: {
    backgroundColor: '#1C1C1E',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: '#4ADE80',
    padding: 16,
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
    paddingBottom: 10,
    marginBottom: 6,
  },
  panelTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2D2D2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  coinCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2D2D2D',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  coinInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coinIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinIconText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  coinSymbolText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  exchangeCountText: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  highestApyInfo: {
    alignItems: 'flex-end',
  },
  apyLabel: {
    fontSize: 10,
    color: '#888888',
    marginBottom: 2,
  },
  highestApyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ADE80',
  },
  highestExchangeText: {
    fontSize: 10,
    color: '#888888',
    marginTop: 2,
  },
  detailsContainer: {
    backgroundColor: '#171717',
    borderTopWidth: 1,
    borderTopColor: '#2D2D2D',
    padding: 16,
  },
  detailsTitle: {
    color: '#888888',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  exchangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#252525',
  },
  exchangeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1, // 긴 한도 텍스트가 밀어내는 것을 방지
  },
  exchangeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 56, // 배지 폭 약간 축소하여 텍스트 공간 확보
    alignItems: 'center',
  },
  exchangeBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  typeInfo: {
    justifyContent: 'center',
    flex: 1, // 텍스트 영역도 유연하게 공간 확보
  },
  typeText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  minAmountText: {
    fontSize: 10,
    color: '#888888',
    marginTop: 2,
  },
  exchangeRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8, // 좌측 정보와 최소 간격 확보
  },
  apyValueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ADE80',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  actionIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2D2D2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkedActiveButton: {
    backgroundColor: 'rgba(243, 186, 47, 0.2)',
  },
  actionIconText: {
    color: '#FFD700',
    fontSize: 16,
  },
  simulateButton: {
    backgroundColor: '#4ADE80',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: 'center',
  },
  simulateButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
