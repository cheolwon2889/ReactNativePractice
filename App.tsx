import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Platform, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StakingProductList } from './src/features/staking/StakingProductList';
import { WatchlistScreen } from './src/features/watchlist/WatchlistScreen';
import YieldSimulator from './src/features/simulator/YieldSimulator';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';

const queryClient = new QueryClient();

type TabName = 'staking' | 'watchlist' | 'calculator';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('staking');
  const [selectedCoin, setSelectedCoin] = useState('USDT');
  const [selectedApy, setSelectedApy] = useState('10.5');
  const [selectedMaxAmount, setSelectedMaxAmount] = useState<number | undefined>(undefined);

  const handleSelectProductForSimulation = (coinSymbol: string, apy: string, maxAmount?: number) => {
    setSelectedCoin(coinSymbol);
    setSelectedApy(apy);
    setSelectedMaxAmount(maxAmount);
    setActiveTab('calculator'); // 계산기 탭으로 전환
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'staking':
        return <StakingProductList onSelectProductForSimulation={handleSelectProductForSimulation} />;
      case 'watchlist':
        return <WatchlistScreen onSelectProductForSimulation={handleSelectProductForSimulation} />;
      case 'calculator':
        return <YieldSimulator selectedCoin={selectedCoin} selectedApy={selectedApy} selectedMaxAmount={selectedMaxAmount} />;
      default:
        return <StakingProductList onSelectProductForSimulation={handleSelectProductForSimulation} />;
    }
  };

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            
            {/* 메인 콘텐츠 화면 */}
            <View style={styles.content}>
              {renderContent()}
            </View>

            {/* 하단 탭 바 (Premium Dark Glassmorphism style) */}
            <View style={styles.tabBar}>
              <TouchableOpacity 
                style={[styles.tabItem, activeTab === 'staking' && styles.activeTabItem]} 
                onPress={() => setActiveTab('staking')}
              >
                <Text style={styles.tabIcon}>{activeTab === 'staking' ? '📊' : '📈'}</Text>
                <Text style={[styles.tabText, activeTab === 'staking' && styles.activeTabText]}>
                  이자율 비교
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.tabItem, activeTab === 'watchlist' && styles.activeTabItem]} 
                onPress={() => setActiveTab('watchlist')}
              >
                <Text style={styles.tabIcon}>{activeTab === 'watchlist' ? '★' : '☆'}</Text>
                <Text style={[styles.tabText, activeTab === 'watchlist' && styles.activeTabText]}>
                  관심 코인
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.tabItem, activeTab === 'calculator' && styles.activeTabItem]} 
                onPress={() => setActiveTab('calculator')}
              >
                <Text style={styles.tabIcon}>🧮</Text>
                <Text style={[styles.tabText, activeTab === 'calculator' && styles.activeTabText]}>
                  수익 계산기
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: Platform.OS === 'android' ? 25 : 0, 
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderTopColor: '#2D2D2D',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  activeTabItem: {
    // 액티브 탭에 들어갈 은은한 디자인
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
    color: '#888888',
  },
  tabText: {
    fontSize: 11,
    color: '#888888',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#4ADE80', // 액티브 상태 민트 그린 색상
  },
});
