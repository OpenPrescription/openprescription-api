import { Prescription } from "../../models";
import { PatientPrescriptionMail } from "../../mails";
import { PDFHtml } from "../../tools/pdf-kit";
import rp from "request-promise";
import crypto from "crypto";
import i18n from "i18n";


const notifyCreaction = (
  prescriptionFile,
  certificate,
  { patientName, patientEmail, doctorName }
) => {
  return new PatientPrescriptionMail({
    username: patientName,
    doctorName,
  })
    .subject(__("Your Prescription"))
    .attach(
      new Buffer(prescriptionFile, "base64"),
      patientName + "-" + __("prescription.pdf")
    )
    .attach(certificate, patientName + "-" + __("prescription-certificate.pdf"))
    .to(patientEmail, patientName)
    .from(process.env.MAIL_FROM, process.env.MAIL_FROM_NAME)
    .send();
};

const createCertificate = async ({
  prescriptionId,
  patientName,
  patientEmail,
  patientDocumentId,
  doctorName,
  doctorId,
  doctorEmail,
  hash,
  doctorDocumentId,
  maxUses,
  expiredAt,
  isPrivate,
  blockSignature,
  doctorExtraInfo,
  lang,
}) => {
  const blockSignaturePieces = blockSignature.split(";");
  const message = blockSignaturePieces[0];
  const blockchainId = blockSignaturePieces[1];
  const digitalSignature = blockSignaturePieces[2];
  const pdf = await new PDFHtml()
    .template("certificate")
    .setLocale(lang)
    .compile({
      prescriptionId,
      patientName,
      patientEmail,
      patientDocumentId,
      doctorName,
      doctorId,
      doctorEmail,
      prescriptionHash: hash,
      maxUses,
      expiration: expiredAt,
      isPrivate: isPrivate ? "Yes" : __("No"),
      blockchainId,
      message: `${new Buffer(message).toString("base64")}`,
      digitalSignature,
      doctorDocumentId,
      doctorExtraInfo,
      certificate_title: __("certificate_title"),
      certificate_subtitle: __("certificate_subtitle", prescriptionId),
      certificate_doctor_info: __("certificate_doctor_info"),
      certificate_name: __("certificate_name"),
      certificate_doctor_id: __("certificate_doctor_id"),
      certificate_patient_info: __("certificate_patient_info"),
      certificate_document_id: __("certificate_document_id"),
      certificate_prescription_info: __("certificate_prescription_info"),
      certificate_prescription: __("certificate_prescription"),
      certificate_max_uses: __("certificate_max_uses"),
      certificate_expiration: __("certificate_expiration"),
      certificate_private: __("certificate_private"),
      certificate_digital_signature_info: __(
        "certificate_digital_signature_info"
      ),
      certificate_blockchainid: __("certificate_blockchainid"),
      certificate_digital_signature: __("certificate_digital_signature"),
      certificate_message: __("certificate_message"),
      certificate_validation_link: __("certificate_validation_link"),
      certificate_here: __("certificate_here"),
      qrcodeUrl: `${process.env.PHARMACY_HOST}/${hash}`,
      verifyUrl: `https://originalmy.com/verify?address=${new Buffer(
        blockchainId
      ).toString("base64")}&signature=${new Buffer(digitalSignature).toString(
        "base64"
      )}&message=${new Buffer(message).toString("base64")}`,
    });
  return pdf.buffer();
};

const certifyDocument = (digest) => {
  return rp({
    uri: `${process.env.ORIGINALMY_API_URL}/company/document/register`,
    method: "POST",
    headers: {
      authorization: process.env.ORIGINALMY_SECRET_KEY,
      origin: process.env.API_HOST,
      "Content-Type": "application/json",
    },
    body: {
      digest,
    },
    json: true,
  });
};

const buffer2sha256 = (buffer) => {
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

const create = async (doctor, prescriptionFile, data, doctorDocumentId) => {
  const {
    patientName,
    patientEmail,
    company,
    hash,
    maxUses,
    digitalSignature,
    expirationDate,
    ip,
    lang,
  } = data;
  const prescription = await Prescription.create({
    doctorId: doctor.id,
    doctorName: doctor.name,
    patientName,
    patientDocumentId: data.patientId,
    patientEmail,
    doctorCompanyId: company.id,
    hash,
    maxUses,
    private: data.isPrivate,
    digitalSignature,
    expiredAt: expirationDate,
    ip,
  });
  const certificate = await createCertificate({
    prescriptionId: prescription.id,
    patientName,
    patientEmail,
    patientDocumentId: data.patientId,
    doctorName: doctor.name,
    doctorEmail: doctor.email,
    doctorDocumentId,
    hash,
    maxUses,
    expiredAt: expirationDate,
    isPrivate: data.isPrivate,
    blockSignature: JSON.parse(data.doctor).block,
    doctorExtraInfo: doctor.doctorExtraInfo ? JSON.parse(doctor.doctorExtraInfo) : null,
    lang,
  });
  console.log("LOCALE STORE: " + i18n.getLocale());
  console.log("CERTIFY PRESCRIPTION");
  //const resPres = await certifyDocument(hash); // Certify prescription document in blockchain
  console.log("CERTIFY CERTIFICATE");
  const certificateHash = buffer2sha256(certificate).toString();
 // const resCert = await certifyDocument(certificateHash); // Certify prescription certificate in blockchain
  //console.log(resPres, resCert);
  prescription.certificateHash = certificateHash;
  prescription.save();
  notifyCreaction(prescriptionFile, certificate, {
    patientName,
    patientEmail,
    doctorName: doctor.name,
  });
};

export default {
  create,
  certifyDocument,
  createCertificate,
  notifyCreaction,
};
