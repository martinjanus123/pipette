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

export interface CalibrationRead {
  id: number;
  calibration_date: string; // ISO date
  next_due_date: string;
  result?: string | null;
  performed_by?: string | null;
  certificate_reference?: string | null;
  notes?: string | null;
}

export interface PipetteDetail extends PipetteListItem {
  calibrations: CalibrationRead[];
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
