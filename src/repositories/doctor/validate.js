import MedicalValidator from "../../tools/medical-validator";
import DoctorInterface from "../../tools/medical-validator/interfaces/doctor.interface";
import { Doctor } from "../../models";

export const nationalId = async (countryCode, { id, name }) => {
  const doctor = new DoctorInterface();
  doctor.id = id;
  doctor.name = name;
  return MedicalValidator.validate(countryCode, doctor);
};

export const newVerificationIsNeeded = async (documentId) => {
  if (process.env.DOCTORID_VALIDATION != "1" || documentId.match(/99999/) != null)
    return false;
  const doctor = await Doctor.findOne({
    where: {
      documentId,
    },
  });
  if(!doctor) return true;
  if (doctor && !doctor.lastVerificationAt) return true;
  const dateToValidate = doctor.lastVerificationAt.setDate(
    doctor.lastVerificationAt.getDate() +
      parseInt(process.env.DOCTORID_VERIFICATION_TIME) || 30
  );
  return dateToValidate < new Date();
};

export default {
  nationalId,
  newVerificationIsNeeded,
};
