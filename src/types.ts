export enum QurbanType {
  KAMBING = "KAMBING",
  SAPI = "SAPI"
}

export enum PaymentStatus {
  PENDING = "PENDING",
  VERIFYING = "VERIFYING",
  PAID = "PAID",
  REJECTED = "REJECTED"
}

export interface Participant {
  id: string;
  name: string;
  qurbanFor: string;
  whatsapp: string;
  address: string;
  type: QurbanType;
  groupId: string | null; // For Sapi
  slotNumber: number | null; // 1-7 for Sapi
  amount: number;
  paymentStatus: PaymentStatus;
  paymentProofUrl: string | null;
  createdAt: any;
  updatedAt: any;
}

export interface QurbanGroup {
  id: string;
  groupNumber: number;
  type: QurbanType.SAPI;
  participantIds: string[];
  isFull: boolean;
  totalAmount: number;
  createdAt: any;
}

export interface QurbanConfig {
  kambingPrice: number;
  sapiJointPrice: number;
  eidAlAdhaDate: string; // ISO format
  logoUrl: string;
}
