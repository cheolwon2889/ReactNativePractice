import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EarnProduct } from '../types/earn';

interface WatchlistState {
  bookmarkedItems: EarnProduct[];
  addBookmark: (item: EarnProduct) => void;
  removeBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
}

/**
 * Zustand를 사용하여 앱 전역에서 '관심 코인(북마크)' 상태를 관리하는 스토어입니다.
 * persist 미들웨어를 사용하여 앱을 껐다 켜도 데이터가 유지되도록 기기(AsyncStorage)에 저장합니다.
 */
export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      // 현재 북마크된 상품들의 배열을 담는 초기 상태값입니다.
      bookmarkedItems: [],

      /**
       * 새로운 상품을 북마크 목록에 추가하는 함수입니다.
       * @param item 추가할 스테이킹 상품 객체(EarnProduct)
       */
      addBookmark: (item) => 
        set((state) => ({ 
          // 기존 배열(state.bookmarkedItems)을 복사하고 맨 끝에 새 item을 추가합니다.
          bookmarkedItems: [...state.bookmarkedItems, item] 
        })),

      /**
       * 특정 상품을 북마크 목록에서 제거하는 함수입니다.
       * @param id 제거할 상품의 고유 ID
       */
      removeBookmark: (id) => 
        set((state) => ({ 
          // filter 함수를 사용해 전달받은 id와 일치하지 '않는' 항목들만 남겨서 배열을 갱신합니다.
          bookmarkedItems: state.bookmarkedItems.filter((item) => item.id !== id) 
        })),

      /**
       * 특정 상품이 현재 북마크 목록에 존재하는지 여부를 확인하는 함수입니다.
       * @param id 확인할 상품의 고유 ID
       * @returns {boolean} 북마크되어 있으면 true, 아니면 false 반환
       */
      isBookmarked: (id) => 
        // get()을 통해 현재 스토어의 상태를 가져온 뒤, some 함수로 하나라도 일치하는 게 있는지 검사합니다.
        get().bookmarkedItems.some((item) => item.id === id),
    }),
    {
      name: 'crypto-watchlist-storage', // 기기 로컬 스토리지에 저장될 데이터의 고유 키(Key) 이름
      storage: createJSONStorage(() => AsyncStorage), // React Native 환경이므로 AsyncStorage를 사용
    }
  )
);
