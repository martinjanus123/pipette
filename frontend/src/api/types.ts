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
  requires_sartorius: boolean;
  calibration_interval_months: number;
  status: string;
  room: string;
  use: string;
  application: string;
  pipette_type: string;
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
