type ApprovedAdmissionPinTemplateInput = {
  name: string;
  whatsapp: string;
  pin: string;
};

export function approvedAdmissionPinTemplate(input: ApprovedAdmissionPinTemplateInput) {
  return {
    template: "approved_admission_pin",
    message: [
      `Welcome to AIRA Skill City, ${input.name}.`,
      "",
      "Your admission is approved.",
      "",
      "Login using:",
      `WhatsApp: ${input.whatsapp}`,
      `Temporary PIN: ${input.pin}`,
      "",
      "Please reset your PIN after your first login.",
      "",
      "Learn. Build. Earn. Grow."
    ].join("\n")
  };
}
