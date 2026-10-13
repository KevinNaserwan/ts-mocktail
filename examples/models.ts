// Example Domain Models
export interface User {
  id: number;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'ENGINEER' | 'VIEWER';
  isActive: boolean;
  createdAt: string;
}

export interface MiningEquipment {
  id: number;
  unitCode: string;
  operatorName: string;
  status: 'OPERATIONAL' | 'BREAKDOWN' | 'STANDBY';
  fuelLevelPercent: number;
  runningHours: number;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  vendorName: string;
  totalAmount: number;
  isApproved: boolean;
}
