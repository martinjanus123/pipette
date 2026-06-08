export interface ReferenceItem {
  id: number;
  name: string;
  is_active: boolean;
}

export interface DropdownData {
  rooms: ReferenceItem[];
  applications: ReferenceItem[];
  uses: ReferenceItem[];
  pipetteTypes: ReferenceItem[];
}

export interface PipetteListItem {
  id: number;
  register_number: number;
  inventory_number: string;
  serial_number: string;
  description: string;
  manufacturer: string;
  model_name: string;
  channel_count: number;
  nominal_volume_ul: number;
  calibration_interval_months: number;
  status: string;
  room: string;
  use: string;
  application: string;
  pipette_type: string;
}

export interface PipetteEvent {
  id: number;
  event_type: string;
  event_date: string;
  old_value?: string | null;
  new_value?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface PipetteDetail extends PipetteListItem {
  events: PipetteEvent[];
}

export interface PipetteCreatePayload {
  manufacturer: string;
  model_name: string;
  inventory_number: string;
  serial_number: string;
  channel_count: number;
  use_id: number;
  pipette_type_id: number;
  nominal_volume_ul: number;
  calibration_interval_months: 6 | 12;
  application_id: number;
  room_id: number;
}

export interface PipetteStatusUpdatePayload {
  status: "active" | "maintenance" | "retired";
  notes?: string;
  created_by?: string;
}
