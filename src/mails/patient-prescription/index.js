import Mail from "../../tools/mail";
import i18n from "i18n";


export default class PatientPrescriptionMail extends Mail {
  constructor(context) {
    super(context);
    this.template = __("prescription_mail_template");
  }
}
