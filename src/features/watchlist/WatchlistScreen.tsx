import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity 
} from 'react-native';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import { EarnProduct } from '../../types/earn';

interface WatchlistScreenProps {
  onSelectProductForSimulation: (coinSymbol: string, apy: string, maxAmount?: number) => void;
}

export const WatchlistScreen: React.FC<WatchlistScreenProps> = ({ 
  onSelectProductForSimulation 
}) => {
  const { bookmarkedItems, removeBookmark } = useWatchlistStore();

  const getExchangeColor = (exchange: string) => {
    switch (exchange) {
      case 'Binance': return '#F3BA2F';
      case 'Bybit': return '#FFA500';
      case 'OKX': return '#FFFFFF';
      case 'Upbit': return '#093687';
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>내 관심 예치 코인 ⭐</Text>
      
      {bookmarkedItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.starText}>⭐</Text>
          <Text style={styles.emptyText}>추가된 관심 상품이 없습니다.</Text>
          <Text style={styles.subText}>
            이자율 비교 화면에서 별(★) 버튼을 클릭하여 관심 상품으로 등록해 보세요.
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookmarkedItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.coinHeader}>
                  <Text style={styles.coinSymbol}>{item.coinSymbol}</Text>
                  
                  <View style={[
                    styles.exchangeBadge, 
                    { 
                      backgroundColor: getExchangeBgColor(item.exchange),
                      borderColor: getExchangeColor(item.exchange),
                      borderWidth: item.exchange === 'OKX' ? 1 : 0
                    }
                  ]}>
                    <Text style={[
                      styles.exchangeBadgeText, 
                      { color: item.exchange === 'OKX' ? '#FFF' : getExchangeColor(item.exchange) }
                    ]}>
                      {item.exchange}
                    </Text>
                  </View>
                </View>

                <View style={styles.details}>
                  <Text style={styles.detailText}>
                    구분: {item.type === 'flexible' ? '자유 입출금' : `${item.durationDays}일 고정`}
                  </Text>
                  <Text style={styles.detailText}>
                    최소: {item.minAmount} {item.coinSymbol}{'\n'}최대: {item.maxAmount ? item.maxAmount.toLocaleString() : '무제한'} {item.coinSymbol}
                  </Text>
                </View>
              </View>

              <View style={styles.cardRight}>
                <Text style={styles.apyText}>{item.apy.toFixed(2)}% APY</Text>
                
                <View style={styles.actionButtons}>
                  {/* 삭제 버튼 */}
                  <TouchableOpacity 
                    style={styles.deleteButton} 
                    onPress={() => removeBookmark(item.id)}
                  >
                    <Text style={styles.deleteButtonText}>삭제</Text>
                  </TouchableOpacity>

                  {/* 계산기 버튼 */}
                  <TouchableOpacity 
                    style={styles.simulateButton}
                    onPress={() => onSelectProductForSimulation(item.coinSymbol, item.apy.toString(), item.maxAmount)}
                  >
                    <Text style={styles.simulateButtonText}>계산기</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: -50,
  },
  starText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D2D2D',
  },
  cardLeft: {
    flex: 1,
    gap: 8,
  },
  coinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coinSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  exchangeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  exchangeBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  details: {
    gap: 2,
  },
  detailText: {
    fontSize: 12,
    color: '#888888',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 12,
  },
  apyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ADE80',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  simulateButton: {
    backgroundColor: '#4ADE80',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  simulateButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
