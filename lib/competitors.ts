export type CompetitorConfig = {
  product: string;
  appStoreId: string;
  playPackage: string;
};

export const GROWW: CompetitorConfig = {
  product: "Groww",
  appStoreId: "1404871703",
  playPackage: "com.nextbillion.groww",
};

export const COMPETITORS: CompetitorConfig[] = [
  { product: "Zerodha Kite", appStoreId: "1449453802", playPackage: "com.zerodha.kite3" },
  { product: "Upstox", appStoreId: "1584953620", playPackage: "in.upstox.app" },
  { product: "Angel One", appStoreId: "1060530981", playPackage: "com.msf.angelmobile" },
];

export const ALL_PRODUCTS: CompetitorConfig[] = [GROWW, ...COMPETITORS];
