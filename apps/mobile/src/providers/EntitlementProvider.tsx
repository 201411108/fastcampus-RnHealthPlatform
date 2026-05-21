import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import {
  EMPTY_ENTITLEMENTS,
  setShouldHideAdsGetter,
  type AppEntitlements,
  type AppStoreProduct,
  type PurchaseOutcome,
  type StoreProductKey,
} from '@rn-health/core';
import {
  configureRevenueCat,
  consumeOneTimePassAfterReportSuccess,
  getEntitlements,
  getStoreProducts,
  purchaseOneTimePass,
  purchasePremium,
  purchaseRemoveAds,
  refreshAll,
  restorePurchases,
} from '../purchases/revenueCatService';

type EntitlementContextValue = {
  entitlements: AppEntitlements;
  products: AppStoreProduct[];
  isReady: boolean;
  isRefreshing: boolean;
  purchasingProductKey: StoreProductKey | null;
  isRestoring: boolean;
  refresh: () => Promise<void>;
  purchaseRemoveAds: () => Promise<PurchaseOutcome>;
  purchaseOneTimePass: () => Promise<PurchaseOutcome>;
  purchasePremium: () => Promise<PurchaseOutcome>;
  restore: () => Promise<PurchaseOutcome>;
  consumeOneTimePassAfterReportSuccess: () => Promise<void>;
};

const EntitlementContext = createContext<EntitlementContextValue | null>(null);

type EntitlementProviderProps = {
  children: ReactNode;
};

export function EntitlementProvider({ children }: EntitlementProviderProps) {
  const [entitlements, setEntitlements] =
    useState<AppEntitlements>(EMPTY_ENTITLEMENTS);
  const [products, setProducts] = useState<AppStoreProduct[]>(getStoreProducts());
  const [isReady, setIsReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [purchasingProductKey, setPurchasingProductKey] =
    useState<StoreProductKey | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const syncFromService = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const result = await refreshAll();
      setProducts(result.products);
      setEntitlements(result.entitlements);
    } finally {
      setIsRefreshing(false);
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    configureRevenueCat()
      .then(() => {
        if (!cancelled) {
          return syncFromService();
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEntitlements(getEntitlements());
          setProducts(getStoreProducts());
          setIsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [syncFromService]);

  useEffect(() => {
    setShouldHideAdsGetter(() => entitlements.shouldHideAds);
  }, [entitlements.shouldHideAds]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        syncFromService().catch(() => {});
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => {
      subscription.remove();
    };
  }, [syncFromService]);

  const runPurchase = useCallback(
    async (
      key: StoreProductKey,
      action: () => Promise<PurchaseOutcome>,
    ): Promise<PurchaseOutcome> => {
      if (purchasingProductKey || isRestoring) {
        return {
          status: 'failed',
          message: '다른 구매가 진행 중이에요.',
        };
      }

      setPurchasingProductKey(key);
      try {
        const outcome = await action();
        if (outcome.status === 'success') {
          await syncFromService();
        }
        return outcome;
      } finally {
        setPurchasingProductKey(null);
      }
    },
    [isRestoring, purchasingProductKey, syncFromService],
  );

  const handleRestore = useCallback(async (): Promise<PurchaseOutcome> => {
    if (purchasingProductKey || isRestoring) {
      return {
        status: 'failed',
        message: '다른 작업이 진행 중이에요.',
      };
    }

    setIsRestoring(true);
    try {
      const outcome = await restorePurchases();
      if (outcome.status === 'success') {
        await syncFromService();
      }
      return outcome;
    } finally {
      setIsRestoring(false);
    }
  }, [isRestoring, purchasingProductKey, syncFromService]);

  const value = useMemo<EntitlementContextValue>(
    () => ({
      entitlements,
      products,
      isReady,
      isRefreshing,
      purchasingProductKey,
      isRestoring,
      refresh: syncFromService,
      purchaseRemoveAds: () =>
        runPurchase('removeAds', purchaseRemoveAds),
      purchaseOneTimePass: () =>
        runPurchase('oneTimePass', purchaseOneTimePass),
      purchasePremium: () => runPurchase('premium', purchasePremium),
      restore: handleRestore,
      consumeOneTimePassAfterReportSuccess: async () => {
        await consumeOneTimePassAfterReportSuccess();
        setEntitlements(getEntitlements());
      },
    }),
    [
      entitlements,
      products,
      isReady,
      isRefreshing,
      purchasingProductKey,
      isRestoring,
      syncFromService,
      runPurchase,
      handleRestore,
    ],
  );

  return (
    <EntitlementContext.Provider value={value}>
      {children}
    </EntitlementContext.Provider>
  );
}

export function useEntitlementContext(): EntitlementContextValue {
  const context = useContext(EntitlementContext);
  if (!context) {
    throw new Error('useEntitlementContext must be used within EntitlementProvider');
  }
  return context;
}
