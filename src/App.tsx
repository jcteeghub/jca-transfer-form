import { createClient } from "@supabase/supabase-js";
import emailjs from "@emailjs/browser";

const supabase = createClient(
  "https://dsomamtpsjqljkrgrtfs.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb21hbXRwc2pxbGprcmdydGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNjg0NTMsImV4cCI6MjA5MDk0NDQ1M30.s0SpVVEYjcBPCJRFiwDGwvZwUUCBBEZx8bGKQw4utTQ"
);

// ── EmailJS Configuration ──
// Set up at https://www.emailjs.com — connect registrar & admissions Gmail accounts
// Replace the placeholders below with your actual IDs from the EmailJS dashboard
const EMAILJS_PUBLIC_KEY    = "YOUR_PUBLIC_KEY";          // Account → API Keys
const EMAILJS_SERVICE_REG   = "YOUR_SERVICE_ID_REGISTRAR"; // Email Services → registrar@jca.edu.ph service
const EMAILJS_SERVICE_ADM   = "YOUR_SERVICE_ID_ADMISSIONS"; // Email Services → admissions@jca.edu.ph service
const EMAILJS_TEMPLATE      = "YOUR_TEMPLATE_ID";          // Email Templates → shared template ID

import React, { useState, useRef, useEffect, type CSSProperties } from "react";

// ── Responsive CSS ──
const responsiveCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; font-family: 'Montserrat', sans-serif; }

  .form-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  .form-row-top {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 8px;
  }
  .form-label {
    width: 150px;
    font-weight: 600;
    flex-shrink: 0;
  }
  .transfer-fields {
    margin-left: 150px;
    padding-left: 8px;
  }
  .transfer-label {
    width: 140px;
    font-weight: 600;
    font-size: 13px;
    flex-shrink: 0;
  }
  .name-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
  }
  .reasons-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .reasons-left {
    border-right: 1px solid #aaa;
  }
  .signature-grid {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 24px;
  }
  .other-row {
    border-top: 1px solid #aaa;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .immigration-detail {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
  }
  .required-star {
    color: red;
    margin-left: 2px;
  }
  .error-msg {
    color: red;
    font-size: 12px;
    margin-top: 2px;
  }

  @media (max-width: 640px) {
    .form-row,
    .form-row-top {
      flex-direction: column;
      align-items: stretch;
    }
    .form-label,
    .transfer-label {
      width: 100%;
      margin-bottom: 4px;
    }
    .transfer-fields {
      margin-left: 0;
      padding-left: 0;
    }
    .name-grid {
      grid-template-columns: 1fr;
    }
    .reasons-grid {
      grid-template-columns: 1fr;
    }
    .reasons-left {
      border-right: none;
      border-bottom: 1px solid #aaa;
    }
    .signature-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
    .other-row {
      flex-direction: column;
      align-items: stretch;
    }
    .immigration-detail {
      flex-direction: column;
      align-items: stretch;
    }
  }
`;

// ── Shared inline styles ──
const input: CSSProperties = {
  border: "1px solid #ccc",
  padding: "6px 8px",
  width: "100%",
  boxSizing: "border-box",
  fontSize: 14,
  borderRadius: 4,
};
const inputError: CSSProperties = {
  ...input,
  border: "2px solid red",
};
const sectionBox: CSSProperties = {
  border: "1px solid #751413",
  borderRadius: 6,
  backgroundColor: "#fff",
  color: "#333",
  padding: 16,
  marginBottom: 16,
};
const checkRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  marginBottom: 4,
};
const boldLabel: CSSProperties = {
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  gap: 6,
  marginBottom: 8,
  color: "#333",
};
const reasonSection: CSSProperties = {
  padding: 16,
  borderBottom: "1px solid #ddd",
};
const subItems: CSSProperties = { marginLeft: 24, marginTop: 8 };

export default function App() {
  const [formData, setFormData] = useState<Record<string, any>>({
    reasons: [],
    school_year: "2025-2026",
    date_filed: "",
    last_name: "",
    first_name: "",
    middle_name: "",
    grade: "",
    application_type: "",
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState(false);
  const [refNumber, setRefNumber] = useState("");

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user fills in a field
    if (value && value !== "Select") {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleCheckbox = (value: string) => {
    const current: string[] = formData.reasons || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFormData((prev) => ({ ...prev, reasons: updated }));
  };

  const has = (v: string) => (formData.reasons || []).includes(v);

  const isShift =
    formData.application_type === "Shift to Jubilee Homeschool" ||
    formData.application_type === "Shift to Jubilee In-school";

  const validate = (): boolean => {
    const newErrors: Record<string, boolean> = {};

    if (!formData.date_filed) newErrors.date_filed = true;
    if (!formData.last_name?.trim()) newErrors.last_name = true;
    if (!formData.first_name?.trim()) newErrors.first_name = true;
    if (
      !formData.grade ||
      formData.grade === "Select" ||
      formData.grade.startsWith("---")
    )
      newErrors.grade = true;
    if (!formData.email?.trim() || !formData.email.includes("@"))
      newErrors.email = true;
    if (!formData.phone?.trim()) newErrors.phone = true;
    if (!formData.application_type || formData.application_type === "Select")
      newErrors.application_type = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getDepartments = (grade: string, applicationType: string): string[] => {
    const departments: string[] = [];

    if (!grade) return departments;

    const isHomeschool = grade.toLowerCase().includes("homeschool");
    const isShiftType =
      applicationType === "Shift to Jubilee Homeschool" ||
      applicationType === "Shift to Jubilee In-school";

    // Transfer/LOA → support departments
    // Shift → Admissions + Academic Affairs (after principal)
    if (!isShiftType) {
      departments.push("Guidance", "Finance", "PAGS", "ERC", "Clinic");
    } else {
      departments.push("Admissions", "Academic Affairs");
    }

    // Add the correct department principal
    if (isHomeschool) {
      departments.push("Homeschool");
    } else {
      const lower = grade.toLowerCase();
      if (
        lower.includes("toddler") ||
        lower.includes("nursery") ||
        lower.includes("kinder")
      ) {
        departments.push("Preschool");
      } else if (
        lower.startsWith("1-") ||
        lower.startsWith("2-") ||
        lower.startsWith("3-")
      ) {
        departments.push("Primary");
      } else if (
        lower.startsWith("4-") ||
        lower.startsWith("5-") ||
        lower.startsWith("6-")
      ) {
        departments.push("Intermediate");
      } else if (
        lower.startsWith("7-") ||
        lower.startsWith("8-") ||
        lower.startsWith("9-") ||
        lower.startsWith("10-")
      ) {
        departments.push("Junior High School");
      } else if (lower.startsWith("11-") || lower.startsWith("12-")) {
        departments.push("Senior High School");
      }
    }

    return departments;
  };

  const generateRefNumber = () => {
    const now = new Date();
    const yr = now.getFullYear().toString().slice(2);
    const nextYr = (now.getFullYear() + 1).toString().slice(2);
    const seq = String(Math.floor(Math.random() * 9000) + 1000);
    return `JCA-${yr}${nextYr}-${seq}`;
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!validate()) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const ref = generateRefNumber();
      const dataWithRef = { ...formData, ref_number: ref };

      const { data: submission, error: subError } = await supabase
        .from("submissions")
        .insert({ data: dataWithRef, status: "pending" })
        .select()
        .single();

      if (subError) throw subError;

      const departments = getDepartments(
        formData.grade,
        formData.application_type
      );

      const clearanceRows = departments.map((dept) => ({
        submission_id: submission.id,
        department: dept,
        status: "pending",
      }));

      const { error: clrError } = await supabase
        .from("clearances")
        .insert(clearanceRows);

      if (clrError) throw clrError;

      // Email all concerned departments — automatically via EmailJS
      try {
        const { data: deptUsers } = await supabase
          .from("department_users")
          .select("email, department")
          .in("department", departments);
        const emails = (deptUsers || []).map((u: any) => u.email);
        if (emails.length > 0) {
          const studentName = `${formData.first_name} ${formData.last_name}`;
          const grade = formData.grade || "";
          const appType = formData.application_type || "";
          const isShift = appType === "Shift to Jubilee Homeschool" || appType === "Shift to Jubilee In-school";

          // Choose sender: Registrar for Transfer/LOA, Admissions for Shift
          const serviceId = isShift ? EMAILJS_SERVICE_ADM : EMAILJS_SERVICE_REG;
          const senderOffice = isShift ? "Admissions Office" : "Registrar's Office";

          const templateParams = {
            to_emails:    emails.join(","),
            student_name: studentName,
            grade:        grade,
            app_type:     appType,
            ref_number:   ref,
            sender_office: senderOffice,
            message:
              `Please be informed that ${studentName} of ${grade} has submitted an application for ${appType}.\n\n` +
              `Reference #: ${ref}\n\n` +
              `May we kindly request your department to review the student's records and confirm clearance at the earliest convenience.\n\n` +
              `Thank you.\n\n${senderOffice}\nJubilee Christian Academy`,
          };

          // If EmailJS is configured, send automatically; otherwise fall back to mailto
          if (EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY") {
            await emailjs.send(serviceId, EMAILJS_TEMPLATE, templateParams, EMAILJS_PUBLIC_KEY);
          } else {
            // Fallback: open mailto (until EmailJS is configured)
            const subject = encodeURIComponent(`Request for Clearance – ${studentName} (Ref: ${ref})`);
            const body = encodeURIComponent(templateParams.message);
            window.open(`mailto:${emails.join(",")}?subject=${subject}&body=${body}`, "_blank");
          }
        }
      } catch (e) {
        // Non-blocking — form was already submitted successfully
      }

      setRefNumber(ref);
      setDone(true);
    } catch (err: any) {
      alert("Error submitting: " + err.message);
    }
  };

  if (done) {
    return (
      <>
        <style>{responsiveCSS}</style>
        <div style={{ maxWidth: 600, margin: "80px auto", padding: 32, fontFamily: "'Montserrat', sans-serif", textAlign: "center", border: "1px solid #751413", borderRadius: 12, background: "#fff", color: "#333", boxShadow: "0 2px 16px rgba(0,0,0,0.3)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px", color: "#751413" }}>Application Submitted Successfully</h1>
          <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, margin: "0 0 20px" }}>
            Thank you for completing your application. Your submission has been received and is now being processed.
          </p>
          <div style={{ background: "#eff6ff", border: "2px solid #2563eb", borderRadius: 8, padding: "16px 24px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: "#1e40af", fontWeight: 600, marginBottom: 4 }}>YOUR REFERENCE NUMBER</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#1e3a8a", letterSpacing: 2 }}>{refNumber}</div>
          </div>
          <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, padding: 14, marginBottom: 20 }}>
            <strong style={{ color: "#92400e", fontSize: 13 }}>⚠ Important:</strong>
            <p style={{ fontSize: 13, color: "#78350f", margin: "4px 0 0", lineHeight: 1.5 }}>
              Please take note of your reference number. Save it or take a screenshot now. This number <strong>will not be shown again</strong> and will be needed when you follow up on your application.
            </p>
          </div>
          <p style={{ fontSize: 13, color: "#666", margin: 0 }}>
            You may close this page. If you have any concerns, please contact the school office and provide your reference number.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{responsiveCSS}</style>
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: 24,
          fontFamily: "'Montserrat', sans-serif",
          fontSize: 14,
          background: "#fff5ca",
          color: "#5f110e",
          minHeight: "100vh",
        }}
      >
        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "#5f110e", textShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>
            Jubilee Christian Academy
          </h1>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#5f110e", textShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>
            Intent to Transfer Form
          </h2>
        </div>

        {/* BASIC INFO */}
        <div style={sectionBox}>
          {/* Date */}
          <div className="form-row">
            <label className="form-label">
              Date Filed: <span className="required-star">*</span>
            </label>
            <div style={{ flex: 1 }}>
              <input
                type="date"
                style={
                  errors.date_filed
                    ? { ...inputError, maxWidth: 220 }
                    : { ...input, maxWidth: 220 }
                }
                value={formData.date_filed}
                onChange={(e) => handleChange("date_filed", e.target.value)}
              />
              {errors.date_filed && (
                <div className="error-msg">Date is required</div>
              )}
            </div>
          </div>

          {/* School Year */}
          <div className="form-row">
            <label className="form-label">School Year:</label>
            <input
              value="2025-2026"
              readOnly
              style={{ ...input, maxWidth: 180, backgroundColor: "#eee" }}
            />
          </div>

          {/* Student's Name */}
          <div className="form-row-top">
            <label className="form-label">
              Student's Name: <span className="required-star">*</span>
            </label>
            <div style={{ flex: 1 }}>
              <div className="name-grid">
                <div>
                  <input
                    style={errors.last_name ? inputError : input}
                    value={formData.last_name}
                    onChange={(e) => handleChange("last_name", e.target.value)}
                  />
                  {errors.last_name && (
                    <div className="error-msg">Required</div>
                  )}
                </div>
                <div>
                  <input
                    style={errors.first_name ? inputError : input}
                    value={formData.first_name}
                    onChange={(e) => handleChange("first_name", e.target.value)}
                  />
                  {errors.first_name && (
                    <div className="error-msg">Required</div>
                  )}
                </div>
                <div>
                  <input
                    style={input}
                    value={formData.middle_name}
                    onChange={(e) =>
                      handleChange("middle_name", e.target.value)
                    }
                  />
                </div>
              </div>
              <div
                className="name-grid"
                style={{ fontSize: 11, color: "#888", marginTop: 2 }}
              >
                <span>Last Name</span>
                <span>First Name</span>
                <span>Middle Name</span>
              </div>
            </div>
          </div>

          {/* Grade */}
          <div className="form-row">
            <label className="form-label">
              Grade / Level: <span className="required-star">*</span>
            </label>
            <div style={{ flex: 1 }}>
              <select
                style={errors.grade ? inputError : input}
                value={formData.grade || "Select"}
                onChange={(e) => handleChange("grade", e.target.value)}
              >
                <option>Select</option>
                <option>Toddler Sunshine</option>
                <option>------------------</option>
                <option>Nursery Joy</option>
                <option>Nursery Love</option>
                <option>Nursery Peace</option>
                <option>Nursery Homeschool</option>
                <option>------------------</option>
                <option>Kinder Abraham</option>
                <option>Kinder David</option>
                <option>Kinder Moses</option>
                <option>Kinder Noah</option>
                <option>Kinder Samuel</option>
                <option>Kinder Homeschool</option>
                <option>-----------------</option>
                <option>1- Jasmine</option>
                <option>1- Lily</option>
                <option>1- Marigold</option>
                <option>1- Tulip</option>
                <option>1- Homeschool</option>
                <option>----------------</option>
                <option>2- Confucius</option>
                <option>2- Lao Tze</option>
                <option>2- Mencius</option>
                <option>2- Sun Tzu</option>
                <option>2- Homeschool</option>
                <option>------------------</option>
                <option>3- Daniel</option>
                <option>3- Ezra</option>
                <option>3- Isaiah</option>
                <option>3- Nehemiah</option>
                <option>3- Homeschool</option>
                <option>------------------</option>
                <option>4- Kabayanihan</option>
                <option>4- Kalayaan</option>
                <option>4- Kaunlaran</option>
                <option>4- Homeschool</option>
                <option>------------------</option>
                <option>5- Euclid</option>
                <option>5- Kepler</option>
                <option>5- Napier</option>
                <option>5- Homeschool</option>
                <option>------------------</option>
                <option>6- Hemingway</option>
                <option>6- Keats</option>
                <option>6- Milton</option>
                <option>------------------</option>
                <option>7- Justice</option>
                <option>7- Rizal</option>
                <option>7- Truth</option>
                <option>------------------</option>
                <option>8- Aristotle</option>
                <option>8- Equality</option>
                <option>8- Righteousness</option>
                <option>------------------</option>
                <option>9- Freedom</option>
                <option>9- Nobility</option>
                <option>9- Sun Yat Sen</option>
                <option>------------------</option>
                <option>10- Purity</option>
                <option>10- Service</option>
                <option>10- Solomon</option>
                <option>------------------</option>
                <option>11- Matthew</option>
                <option>11- Paul</option>
                <option>11- Peter</option>
                <option>------------------</option>
                <option>12- Dwight Moody</option>
                <option>12- Hudson Taylor</option>
                <option>12- Martin Luther</option>
              </select>
              {errors.grade && (
                <div className="error-msg">Grade / Level is required</div>
              )}
            </div>
          </div>

          {/* Email Address */}
          <div className="form-row">
            <label className="form-label">
              Email Address: <span className="required-star">*</span>
            </label>
            <div style={{ flex: 1 }}>
              <input
                type="email"
                style={errors.email ? inputError : input}
                placeholder="student@student.jca.edu.ph"
                value={formData.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
              />
              {errors.email && (
                <div className="error-msg">Email address is required</div>
              )}
            </div>
          </div>

          {/* Phone Number */}
          <div className="form-row">
            <label className="form-label">
              Phone Number: <span className="required-star">*</span>
            </label>
            <div style={{ flex: 1 }}>
              <input
                type="tel"
                style={errors.phone ? inputError : input}
                placeholder="09XX XXX XXXX"
                value={formData.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
              {errors.phone && (
                <div className="error-msg">Phone number is required</div>
              )}
            </div>
          </div>

          {/* Type of Application */}
          <div className="form-row">
            <label className="form-label">
              Type of Application: <span className="required-star">*</span>
            </label>
            <div style={{ flex: 1 }}>
              <select
                style={errors.application_type ? inputError : input}
                value={formData.application_type || "Select"}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    application_type: val,
                    reasons: [],
                    other_reasons: "",
                    disciplinary_details: "",
                  }));
                  if (val && val !== "Select") {
                    setErrors((prev) => ({ ...prev, application_type: false }));
                  }
                }}
              >
                <option>Select</option>
                <option>Leave of Absence</option>
                <option>Transfer to Another School</option>
                <option>Shift to Jubilee Homeschool</option>
                <option>Shift to Jubilee In-school</option>
              </select>
              {errors.application_type && (
                <div className="error-msg">Type of Application is required</div>
              )}
            </div>
          </div>

          {formData.application_type === "Transfer to Another School" && (
            <div className="transfer-fields">
              <div className="form-row">
                <label className="transfer-label">School to Transfer To</label>
                <input
                  style={input}
                  value={formData.transfer_school || ""}
                  onChange={(e) =>
                    handleChange("transfer_school", e.target.value)
                  }
                />
              </div>
              <div className="form-row">
                <label className="transfer-label">Location</label>
                <input
                  style={input}
                  value={formData.transfer_location || ""}
                  onChange={(e) =>
                    handleChange("transfer_location", e.target.value)
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* ================================================ */}
        {/* ORIGINAL REASONS — Transfer & Leave of Absence    */}
        {/* ================================================ */}
        {!isShift && formData.application_type && formData.application_type !== "Select" && (
          <div style={{ ...sectionBox, padding: 0 }}>
            <div
              style={{
                padding: 12,
                fontWeight: 600,
                fontStyle: "italic",
                borderBottom: "1px solid #aaa",
              }}
            >
              Reason(s) for Transfer{" "}
              <span style={{ fontWeight: 400 }}>
                (Please check all applicable boxes and provide additional
                details where necessary.)
              </span>
            </div>

            <div className="reasons-grid">
              {/* LEFT COLUMN */}
              <div className="reasons-left">
                {/* FAMILY */}
                <div style={reasonSection}>
                  <label style={boldLabel}>
                    <input type="checkbox" /> FAMILY-RELATED CONCERNS
                  </label>
                  <div style={subItems}>
                    <label style={checkRow}>
                      <input
                        type="checkbox"
                        checked={has("Personal Concerns")}
                        onChange={() => handleCheckbox("Personal Concerns")}
                      />
                      Personal Concerns
                    </label>
                    <label style={checkRow}>
                      <input
                        type="checkbox"
                        checked={has("Change of Residence")}
                        onChange={() => handleCheckbox("Change of Residence")}
                      />
                      Change of Residence
                    </label>
                    <label style={checkRow}>
                      <input
                        type="checkbox"
                        checked={has("Desire to be with siblings")}
                        onChange={() =>
                          handleCheckbox("Desire to be with siblings")
                        }
                      />
                      Desire to be with siblings
                    </label>
                  </div>
                  {has("Desire to be with siblings") && (
                    <div style={{ marginTop: 12, fontSize: 13 }}>
                      <p style={{ margin: 0 }}>
                        If applicable, please indicate where the sibling is
                        currently studying:
                      </p>
                      <div style={{ fontSize: 11, marginTop: 4 }}></div>
                      <input
                        style={{ ...input, marginTop: 4 }}
                        value={formData.sibling_school || ""}
                        onChange={(e) =>
                          handleChange("sibling_school", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>

                {/* SECURITY / HEALTH */}
                <div style={reasonSection}>
                  <label style={boldLabel}>
                    <input type="checkbox" /> SECURITY/HEALTH CONCERNS
                  </label>
                  <div style={subItems}>
                    <label style={checkRow}>
                      <input
                        type="checkbox"
                        checked={has("Security or Safety Concerns")}
                        onChange={() => handleCheckbox("Security or Safety Concerns")}
                      />
                      Security or Safety Concerns
                    </label>
                    <label style={checkRow}>
                      <input
                        type="checkbox"
                        checked={has("Health Reasons")}
                        onChange={() => handleCheckbox("Health Reasons")}
                      />
                      Health Reasons
                    </label>
                  </div>
                  {has("Health Reasons") && (
                    <div style={{ marginTop: 8, fontSize: 13 }}>
                      <p style={{ margin: 0 }}>
                        (Medical/Socio-emotional/Developmental):
                      </p>
                      <textarea
                        style={{
                          ...input,
                          height: 70,
                          marginTop: 4,
                          resize: "vertical",
                        }}
                        value={formData.health_details || ""}
                        onChange={(e) =>
                          handleChange("health_details", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>

                {/* IMMIGRATION */}
                <div style={reasonSection}>
                  <label style={boldLabel}>
                    <input
                      type="checkbox"
                      checked={has("Moving Abroad")}
                      onChange={() => handleCheckbox("Moving Abroad")}
                    />
                    IMMIGRATION (Moving Abroad)
                  </label>
                  {has("Moving Abroad") && (
                    <div className="immigration-detail">
                      <label style={{ whiteSpace: "nowrap" }}>
                        Destination Country:
                      </label>
                      <input
                        style={{ ...input, flex: 1, minWidth: 150 }}
                        placeholder="e.g., Canada"
                        value={formData.destination_country || ""}
                        onChange={(e) =>
                          handleChange("destination_country", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>

                {/* ACADEMIC */}
                <div style={{ ...reasonSection, borderBottom: "none" }}>
                  <label style={boldLabel}>
                    <input type="checkbox" /> ACADEMIC REASONS
                  </label>
                  <div style={subItems}>
                    <label style={checkRow}>
                      <input
                        type="checkbox"
                        checked={has("Different academic program")}
                        onChange={() =>
                          handleCheckbox("Different academic program")
                        }
                      />
                      Seeking a different academic program or specialization
                    </label>
                    {has("Different academic program") && (
                      <div
                        style={{
                          marginLeft: 24,
                          marginTop: 4,
                          marginBottom: 8,
                        }}
                      >
                        <label style={checkRow}>
                          <input type="checkbox" checked readOnly />
                          Preferred Academic program/ SHS Program / strand /
                          offering
                        </label>
                        <input
                          style={{ ...input, marginTop: 4 }}
                          value={formData.preferred_program || ""}
                          onChange={(e) =>
                            handleChange("preferred_program", e.target.value)
                          }
                        />
                      </div>
                    )}
                    <label style={checkRow}>
                      <input
                        type="checkbox"
                        checked={has("Discontinuation of Chinese Curriculum")}
                        onChange={() => handleCheckbox("Discontinuation of Chinese Curriculum")}
                      />
                      Discontinuation of Chinese Curriculum
                    </label>
                    <label style={checkRow}>
                      <input
                        type="checkbox"
                        checked={has("Dissatisfaction with Teaching Approach")}
                        onChange={() => handleCheckbox("Dissatisfaction with Teaching Approach")}
                      />
                      Dissatisfaction with Teaching Approach and/or Faculty
                    </label>
                    <label style={checkRow}>
                      <input
                        type="checkbox"
                        checked={has("Dissatisfaction with the curriculum")}
                        onChange={() => handleCheckbox("Dissatisfaction with the curriculum")}
                      />
                      Dissatisfaction with the curriculum
                    </label>
                    <label style={checkRow}>
                      <input
                        type="checkbox"
                        checked={has("Transition to Homeschool")}
                        onChange={() =>
                          handleCheckbox("Transition to Homeschool")
                        }
                      />
                      Transition to Homeschooling
                    </label>
                    {has("Transition to Homeschool") && (
                      <div style={{ marginLeft: 24, marginTop: 8 }}>
                        <p style={{ margin: 0 }}>
                          Would you like to consider JCA Homeschool?
                        </p>
                        <div
                          style={{ display: "flex", gap: 16, marginTop: 4 }}
                        >
                          <label style={checkRow}>
                            <input
                              type="radio"
                              name="hs"
                              checked={formData.jca_homeschool === "Yes"}
                              onChange={() =>
                                handleChange("jca_homeschool", "Yes")
                              }
                            />{" "}
                            Yes
                          </label>
                          <label style={checkRow}>
                            <input
                              type="radio"
                              name="hs"
                              checked={formData.jca_homeschool === "No"}
                              onChange={() =>
                                handleChange("jca_homeschool", "No")
                              }
                            />{" "}
                            No
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div>
                {/* SCHOOL EXPERIENCE */}
                <div style={reasonSection}>
                  <label style={boldLabel}>
                    <input type="checkbox" /> SCHOOL EXPERIENCE/ENVIRONMENT
                  </label>
                  <div style={subItems}>
                    <label style={checkRow}>
                      <input
                        type="checkbox"
                        checked={has("Learning environment")}
                        onChange={() => handleCheckbox("Learning environment")}
                      />
                      Learning environment (e.g. Class Size)
                    </label>
                    <label style={checkRow}>
                      <input
                        type="checkbox"
                        checked={has("School Rules and Policies")}
                        onChange={() => handleCheckbox("School Rules and Policies")}
                      />
                      School Rules and Policies
                    </label>
                    <label style={checkRow}>
                      <input
                        type="checkbox"
                        checked={has("Student Experience")}
                        onChange={() => handleCheckbox("Student Experience")}
                      />
                      Student Experience (e.g. Social Adjustment /
                      Extra-curricular)
                    </label>
                  </div>
                </div>

                {/* FINANCIAL */}
                <div style={reasonSection}>
                  <label style={boldLabel}>
                    <input type="checkbox" /> FINANCIAL REASON
                  </label>
                  <div style={subItems}>
                    <label style={checkRow}>
                      <input
                        type="checkbox"
                        checked={has("School Fees")}
                        onChange={() => handleCheckbox("School Fees")}
                      />
                      School Fees
                    </label>
                    {has("School Fees") && (
                      <div style={{ marginTop: 12 }}>
                        <p style={{ margin: "0 0 4px" }}>
                          Have you been introduced to our Scholarship Program?
                        </p>
                        <div style={{ display: "flex", gap: 16 }}>
                          <label style={checkRow}>
                            <input
                              type="radio"
                              name="sch1"
                              checked={
                                formData.scholarship_introduced === "Yes"
                              }
                              onChange={() =>
                                handleChange("scholarship_introduced", "Yes")
                              }
                            />{" "}
                            Yes
                          </label>
                          <label style={checkRow}>
                            <input
                              type="radio"
                              name="sch1"
                              checked={
                                formData.scholarship_introduced === "No"
                              }
                              onChange={() =>
                                handleChange("scholarship_introduced", "No")
                              }
                            />{" "}
                            No
                          </label>
                        </div>
                        <p style={{ margin: "8px 0 4px" }}>
                          Are you open to being contacted about scholarship
                          opportunities?
                        </p>
                        <div style={{ display: "flex", gap: 16 }}>
                          <label style={checkRow}>
                            <input
                              type="radio"
                              name="sch2"
                              checked={formData.scholarship_contact === "Yes"}
                              onChange={() =>
                                handleChange("scholarship_contact", "Yes")
                              }
                            />{" "}
                            Yes
                          </label>
                          <label style={checkRow}>
                            <input
                              type="radio"
                              name="sch2"
                              checked={formData.scholarship_contact === "No"}
                              onChange={() =>
                                handleChange("scholarship_contact", "No")
                              }
                            />{" "}
                            No
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* SCHOOL RECOMMENDATION */}
                <div style={{ ...reasonSection, borderBottom: "none" }}>
                  <label style={boldLabel}>
                    <input type="checkbox" /> SCHOOL RECOMMENDATION
                  </label>
                  <div style={subItems}>
                    <p style={{ margin: "0 0 4px" }}>
                      Advised to transfer due to
                    </p>
                    <label style={checkRow}>
                      <input
                        type="checkbox"
                        checked={has("2nd retention in the department")}
                        onChange={() => handleCheckbox("2nd retention in the department")}
                      />
                      2nd retention in the department
                    </label>
                    <label style={checkRow}>
                      <input
                        type="checkbox"
                        checked={has("2nd year of failure in Chinese")}
                        onChange={() => handleCheckbox("2nd year of failure in Chinese")}
                      />
                      2nd year of failure in Chinese in the department
                    </label>
                    <label style={checkRow}>
                      <input
                        type="checkbox"
                        checked={has("Failure to meet Probation")}
                        onChange={() => handleCheckbox("Failure to meet Probation")}
                      />
                      Failure to meet Academic / Disciplinary Probation
                    </label>
                    <label style={checkRow}>
                      <input
                        type="checkbox"
                        checked={has("2 or more C- ratings")}
                        onChange={() => handleCheckbox("2 or more C- ratings")}
                      />
                      2 or more /C-/ Department ratings in one school year
                    </label>
                    <label style={checkRow}>
                      <input
                        type="checkbox"
                        checked={has("Dropped")}
                        onChange={() => handleCheckbox("Dropped")}
                      />
                      Dropped
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* OTHER REASONS */}
            <div className="other-row">
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                }}
              >
                <input
                  type="checkbox"
                  checked={has("Other Reasons")}
                  onChange={() => handleCheckbox("Other Reasons")}
                />
                <span>
                  Other Reasons: <i>Please specify:</i>
                </span>
              </label>
              <input
                style={{ ...input, flex: 1, minWidth: 200 }}
                placeholder="Please specify other reasons..."
                value={formData.other_reasons || ""}
                onChange={(e) =>
                  handleChange("other_reasons", e.target.value)
                }
              />
            </div>
          </div>
        )}

        {/* ================================================ */}
        {/* SHIFTEE REASONS — Shift types only               */}
        {/* ================================================ */}
        {isShift && (
          <div style={{ ...sectionBox, padding: 0 }}>
            <div
              style={{
                padding: 12,
                fontWeight: 600,
                fontStyle: "italic",
                borderBottom: "1px solid #aaa",
              }}
            >
              Reason(s) for Transition{" "}
              <span style={{ fontWeight: 400 }}>
                (Please check all applicable boxes and provide additional
                details where necessary.)
              </span>
            </div>

            <div style={{ padding: 16 }}>
              {/* ACADEMIC */}
              <div style={reasonSection}>
                <label style={boldLabel}>
                  <input type="checkbox" /> ACADEMIC
                </label>
                <div style={subItems}>
                  <label style={checkRow}>
                    <input
                      type="checkbox"
                      checked={has("Need for a more flexible learning pace")}
                      onChange={() => handleCheckbox("Need for a more flexible learning pace")}
                    />
                    Need for a more flexible learning pace
                  </label>
                  <label style={checkRow}>
                    <input
                      type="checkbox"
                      checked={has("Desire for a different curriculum or teaching approach")}
                      onChange={() => handleCheckbox("Desire for a different curriculum or teaching approach")}
                    />
                    Desire for a different curriculum or teaching approach
                  </label>
                  <label style={checkRow}>
                    <input
                      type="checkbox"
                      checked={has("Academic struggles in the current setup")}
                      onChange={() => handleCheckbox("Academic struggles in the current setup")}
                    />
                    Academic struggles in the current setup
                  </label>
                  <label style={checkRow}>
                    <input
                      type="checkbox"
                      checked={has("Gifted/Advanced learner seeking enrichment")}
                      onChange={() => handleCheckbox("Gifted/Advanced learner seeking enrichment")}
                    />
                    Gifted/Advanced learner seeking enrichment
                  </label>
                </div>
              </div>

              {/* FAMILY & LIFESTYLE */}
              <div style={reasonSection}>
                <label style={boldLabel}>
                  <input type="checkbox" /> FAMILY &amp; LIFESTYLE
                </label>
                <div style={subItems}>
                  <label style={checkRow}>
                    <input
                      type="checkbox"
                      checked={has("Family relocation or travel schedule")}
                      onChange={() => handleCheckbox("Family relocation or travel schedule")}
                    />
                    Family relocation or travel schedule
                  </label>
                  <label style={checkRow}>
                    <input
                      type="checkbox"
                      checked={has("Preference for a home-based learning environment")}
                      onChange={() => handleCheckbox("Preference for a home-based learning environment")}
                    />
                    Preference for a home-based learning environment
                  </label>
                  <label style={checkRow}>
                    <input
                      type="checkbox"
                      checked={has("Religious or values-based family preference")}
                      onChange={() => handleCheckbox("Religious or values-based family preference")}
                    />
                    Religious or values-based family preference
                  </label>
                </div>
              </div>

              {/* HEALTH & WELL-BEING */}
              <div style={reasonSection}>
                <label style={boldLabel}>
                  <input type="checkbox" /> HEALTH &amp; WELL-BEING
                </label>
                <div style={subItems}>
                  <label style={checkRow}>
                    <input
                      type="checkbox"
                      checked={has("Physical health condition requiring flexible schedule")}
                      onChange={() => handleCheckbox("Physical health condition requiring flexible schedule")}
                    />
                    Physical health condition requiring flexible schedule
                  </label>
                  <label style={checkRow}>
                    <input
                      type="checkbox"
                      checked={has("Mental or emotional health concerns")}
                      onChange={() => handleCheckbox("Mental or emotional health concerns")}
                    />
                    Mental or emotional health concerns
                  </label>
                  <label style={checkRow}>
                    <input
                      type="checkbox"
                      checked={has("Need for a less stressful learning environment")}
                      onChange={() => handleCheckbox("Need for a less stressful learning environment")}
                    />
                    Need for a less stressful learning environment
                  </label>
                </div>
              </div>

              {/* BEHAVIORAL / SOCIAL */}
              <div style={reasonSection}>
                <label style={boldLabel}>
                  <input type="checkbox" /> BEHAVIORAL / SOCIAL
                </label>
                <div style={subItems}>
                  <label style={checkRow}>
                    <input
                      type="checkbox"
                      checked={has("Social adjustment difficulties")}
                      onChange={() => handleCheckbox("Social adjustment difficulties")}
                    />
                    Social adjustment difficulties
                  </label>
                  <label style={checkRow}>
                    <input
                      type="checkbox"
                      checked={has("Disciplinary concerns")}
                      onChange={() => handleCheckbox("Disciplinary concerns")}
                    />
                    Disciplinary concerns
                  </label>
                </div>
                {has("Disciplinary concerns") && (
                  <div style={{ marginLeft: 24, marginTop: 8 }}>
                    <label style={{ fontSize: 13 }}>Please specify:</label>
                    <textarea
                      style={{
                        ...input,
                        height: 60,
                        marginTop: 4,
                        resize: "vertical",
                      }}
                      placeholder="Please provide details..."
                      value={formData.disciplinary_details || ""}
                      onChange={(e) =>
                        handleChange("disciplinary_details", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>

              {/* JCA-RELATED */}
              <div style={{ ...reasonSection, borderBottom: "none" }}>
                <label style={boldLabel}>
                  <input type="checkbox" /> JCA-RELATED
                </label>
                <div style={subItems}>
                  <label style={checkRow}>
                    <input
                      type="checkbox"
                      checked={has("Dissatisfaction with school policies or management")}
                      onChange={() => handleCheckbox("Dissatisfaction with school policies or management")}
                    />
                    Dissatisfaction with school policies or management
                  </label>
                  <label style={checkRow}>
                    <input
                      type="checkbox"
                      checked={has("Concerns about school facilities or resources")}
                      onChange={() => handleCheckbox("Concerns about school facilities or resources")}
                    />
                    Concerns about school facilities or resources
                  </label>
                  <label style={checkRow}>
                    <input
                      type="checkbox"
                      checked={has("Teacher or staff-related concerns")}
                      onChange={() => handleCheckbox("Teacher or staff-related concerns")}
                    />
                    Teacher or staff-related concerns
                  </label>
                </div>
              </div>
            </div>

            {/* OTHER REASONS */}
            <div className="other-row">
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                }}
              >
                <input
                  type="checkbox"
                  checked={has("Other Reasons")}
                  onChange={() => handleCheckbox("Other Reasons")}
                />
                <span>
                  Other Reasons: <i>Please specify:</i>
                </span>
              </label>
              <input
                style={{ ...input, flex: 1, minWidth: 200 }}
                placeholder="Please specify other reasons..."
                value={formData.other_reasons || ""}
                onChange={(e) =>
                  handleChange("other_reasons", e.target.value)
                }
              />
            </div>
          </div>
        )}

        {/* PARENT LETTER */}
        {formData.application_type && formData.application_type !== "Select" && (
          <div style={sectionBox}>
            <div
              style={{
                fontWeight: 600,
                fontSize: 14,
                marginBottom: 8,
              }}
            >
              Letter of Intent <span style={{ color: "red" }}>*</span>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#555",
                marginBottom: 10,
                lineHeight: 1.5,
                background: "#f9fafb",
                padding: 12,
                borderRadius: 6,
                border: "1px solid #ddd",
              }}
            >
              Please write a brief letter addressed to your child's current
              department formally stating your intention to transfer to another
              school or shift to another department. Kindly include:
              <ul style={{ margin: "6px 0", paddingLeft: 20 }}>
                <li>Reason(s) for transfer or shift</li>
                <li>
                  Any relevant information that will help the school understand
                  your decision
                </li>
                <li>Your plans moving forward, if you wish to share</li>
              </ul>
              <em>
                This letter is required for the processing of your request.
              </em>
            </div>
            <textarea
              style={{
                ...input,
                height: 180,
                resize: "vertical",
              }}
              placeholder="Dear [Department Principal],&#10;&#10;I am writing to formally inform you of our intention to..."
              value={formData.parent_letter || ""}
              onChange={(e) => handleChange("parent_letter", e.target.value)}
            />
          </div>
        )}

        {/* SIGNATURE SECTION */}
        <div
          style={{
            ...sectionBox,
            backgroundColor: "#eff6ff",
            padding: 20,
            color: "#333",
          }}
        >
          <div className="signature-grid">
            <div>
              <label style={{ fontWeight: 600, color: "#333" }}>
                Signature of Parent / Guardian:{" "}
                <span style={{ color: "red" }}>*</span>
              </label>
              <SignaturePad />
            </div>
            <div>
              <label style={{ fontWeight: 600, color: "#333" }}>
                Date: <span style={{ color: "red" }}>*</span>
              </label>
              <input type="date" style={{ ...input, marginTop: 8 }} />
            </div>
          </div>

          <p
            style={{
              textAlign: "center",
              fontSize: 13,
              fontStyle: "italic",
              marginTop: 16,
              color: "#555",
            }}
          >
            By signing above, I confirm that the information provided is true
            and correct.
          </p>

          <button
            onClick={handleSubmit}
            style={{
              width: "100%",
              marginTop: 16,
              backgroundColor: "#751413",
              color: "#fff",
              fontWeight: 600,
              padding: "12px 0",
              borderRadius: 6,
              border: "none",
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            Submit Application
          </button>
        </div>
      </div>
    </>
  );
}

function SignaturePad() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);

  const getPos = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: e.nativeEvent.offsetX * scaleX,
      y: e.nativeEvent.offsetY * scaleY,
    };
  };

  const start = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const ctx = canvasRef.current!.getContext("2d");
    const pos = getPos(e);
    ctx!.beginPath();
    ctx!.moveTo(pos.x, pos.y);
    setDrawing(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext("2d");
    const pos = getPos(e);
    ctx!.lineTo(pos.x, pos.y);
    ctx!.stroke();
  };

  const end = () => setDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prevent = (e: TouchEvent) => e.preventDefault();
    canvas.addEventListener("touchstart", prevent, { passive: false });
    canvas.addEventListener("touchmove", prevent, { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", prevent);
      canvas.removeEventListener("touchmove", prevent);
    };
  }, []);

  return (
    <div style={{ marginTop: 8 }}>
      <canvas
        ref={canvasRef}
        width={500}
        height={150}
        style={{
          border: "1px solid #ccc",
          width: "100%",
          backgroundColor: "white",
          borderRadius: 4,
          touchAction: "none",
        }}
        onMouseDown={start}
        onMouseMove={draw}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={draw}
        onTouchEnd={end}
      />
      <button
        onClick={clear}
        style={{
          color: "#ef4444",
          background: "none",
          border: "none",
          fontSize: 13,
          cursor: "pointer",
          marginTop: 4,
        }}
      >
        Clear Signature
      </button>
    </div>
  );
}
