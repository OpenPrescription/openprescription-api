import rp from "request-promise";
import DoctorValidation from "../interfaces/doctor-validation.interface";
import AwsAPIGateway from "../../aws-api-gateway";

export default class BrazilianFederalCouncilofMedicine {
  constructor(doctor) {
    this.doctor = doctor;
    this.name = "cfm";
  }

  _removeStateFromDoctorId(doctorId) {
    return doctorId.replace(/-\w{2}$/, "");
  }

  _getFirstName(doctorName) {
    return doctorName.split(" ")[0];
  }

  _normalizeName(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  async _request() {
    console.log(this.doctor);
    const response = await new AwsAPIGateway("kvglzg9apl").get("/search/br", {
      doctorid: this._removeStateFromDoctorId(this.doctor.id),
      doctorname: this._normalizeName(this._getFirstName(this.doctor.name)),
    });
    return response.data;
  }

  async validate() {
    const response = await this._request();
    const isValid = new RegExp("CRM:\\s+\\d+(\\s+-\\s+\\w{2})?","gi").test(response.doctorData)
    return new DoctorValidation(isValid, response.doctorData);
  }
}
