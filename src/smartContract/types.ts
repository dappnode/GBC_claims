export interface AddressToIncentive {
  endTime: number;
  isClaimed: boolean;
}

export interface AddressIncentiveProgram {
  address: string;
  status: AddressStatus;
  timestamp?: string;
}

export type AddressStatus = "claimed" | "pending" | "expired" | "renewed" | "notWhitelisted" | "unknown";
