/**
 * Tipos TypeScript para public.patient_doctor_links.
 */

export type LinkStatus = "pending" | "accepted" | "revoked";

export type PatientDoctorLink = {
  id: string;
  patient_id: string;
  doctor_id: string;
  status: LinkStatus;
  created_at: string;
  updated_at: string;
};

/** Vínculo con datos del médico — para la vista de la paciente */
export type LinkWithDoctor = PatientDoctorLink & {
  doctor: {
    id: string;
    display_name: string;
    email: string;
  } | null;
};

/** Vínculo con datos de la paciente — para la vista del médico */
export type LinkWithPatient = PatientDoctorLink & {
  patient: {
    id: string;
    display_name: string;
    email: string;
  } | null;
};
