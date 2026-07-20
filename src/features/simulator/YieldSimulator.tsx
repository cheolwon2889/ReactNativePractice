import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';

interface YieldSimulatorProps {
  selectedCoin?: string;
  selectedApy?: string;
  selectedMaxAmount?: number;
}

const YieldSimulator: React.FC<YieldSimulatorProps> = ({ 
  selectedCoin = 'USDT', 
  selectedApy = '10.5',
  selectedMaxAmount
}) => {
  const [amount, setAmount] = useState('1000');
  const [apy, setApy] = useState(selectedApy);
  const [coin, setCoin] = useState(selectedCoin);
  const [maxLimit, setMaxLimit] = useState<number | undefined>(selectedMaxAmount);

  // 리스트나 관심 상품에서 클릭 시 시뮬레이터 값을 갱신하기 위해 동기화
  React.useEffect(() => {
    setCoin(selectedCoin);
    setApy(selectedApy);
    setMaxLimit(selectedMaxAmount);
  }, [selectedCoin, selectedApy, selectedMaxAmount]);

  const formatWithCommas = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US', { maximumFractionDigits: 4 });
  };

  const yields = useMemo(() => {
    const principal = parseFloat(amount) || 0; 
    const rate = (parseFloat(apy) || 0) / 100;
    const yearly = principal * rate;
    const monthly = yearly / 12;
    const weekly = yearly / 52;
    const daily = yearly / 365;

    return {
      daily: daily.toFixed(4),
      weekly: weekly.toFixed(4),
      monthly: monthly.toFixed(4),
      yearly: formatWithCommas(yearly.toString()),
    };
  }, [amount, apy]);

  const parsedAmount = parseFloat(amount) || 0;
  const isOverLimit = maxLimit !== undefined && parsedAmount > maxLimit;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>예상 스테이킹 수익 계산기 📈</Text>
      
      <View style={styles.inputCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>예치 코인 심볼</Text>
          <TextInput
            style={styles.input}
            value={coin}
            onChangeText={setCoin}
            placeholderTextColor="#666"
            placeholder="USDT"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>예치 수량 ({coin})</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            placeholderTextColor="#666"
            placeholder="0.00"
          />
          {maxLimit !== undefined && (
            <Text style={[styles.limitHint, isOverLimit && styles.limitHintWarning]}>
              {isOverLimit 
                ? `⚠️ 한도 초과! 최대 예치 한도: ${maxLimit.toLocaleString()} ${coin}`
                : `✓ 예치 가능 (최대 한도: ${maxLimit.toLocaleString()} ${coin})`}
            </Text>
          )}
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>연간 예상 APY (%)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={apy}
            onChangeText={setApy}
            placeholderTextColor="#666"
            placeholder="0.0"
          />
        </View>
      </View>

      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>기간별 예상 수익금</Text>
        
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>일일 (Daily)</Text>
          <Text style={styles.resultValue}>+ {yields.daily} {coin}</Text>
        </View>
        
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>주간 (Weekly)</Text>
          <Text style={styles.resultValue}>+ {yields.weekly} {coin}</Text>
        </View>
        
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>월간 (Monthly)</Text>
          <Text style={styles.resultValue}>+ {yields.monthly} {coin}</Text>
        </View>
        
        <View style={[styles.resultRow, styles.yearlyRow]}>
          <Text style={styles.yearlyLabel}>연간 (Yearly)</Text>
          <Text style={styles.yearlyValue}>+ {yields.yearly} {coin}</Text>
        </View>
      </View>

      {/* 스토어 심사 통과를 위한 필수 면책 조항 (Disclaimer) UI 추가 */}
      <View style={styles.disclaimerContainer}>
        <Text style={styles.disclaimerText}>
          ⚠️ 주의: 본 시뮬레이터의 계산 결과는 단순 예상치(Estimate)이며, 
          실제 수익을 보장하지 않습니다. 시장 상황과 거래소 정책에 따라 변동될 수 있습니다. 
          (Not Financial Advice)
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  inputCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#A0A0A0',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2C2C2C',
    color: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  limitHint: {
    fontSize: 12,
    color: '#888888',
    marginTop: 8,
    fontWeight: '600',
  },
  limitHintWarning: {
    color: '#EF4444',
  },
  resultCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  resultTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  resultLabel: {
    color: '#A0A0A0',
    fontSize: 15,
  },
  resultValue: {
    color: '#4ADE80',
    fontSize: 15,
    fontWeight: '600',
  },
  yearlyRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    backgroundColor: '#252525',
    padding: 16,
    borderRadius: 12,
  },
  yearlyLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  yearlyValue: {
    color: '#4ADE80',
    fontSize: 20,
    fontWeight: 'bold',
  },
  disclaimerContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // 은은한 빨간색 배경 (경고 느낌)
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginBottom: 40,
  },
  disclaimerText: {
    color: '#FCA5A5', // 옅은 빨간색 텍스트
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  }
});

export default YieldSimulator;
