import Mail from "../../tools/mail";
import i18n from "i18n";


export default class PatientPrescriptionMail extends Mail {
  constructor(context) {
    super(context);
    //this.template = "prescription";
    console.log(i18n.__("prescription_mail_template"));
    this.template = i18n.__("prescription_mail_template");
  }
}
