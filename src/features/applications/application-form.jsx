import { useState } from "react";
import { Plus, Save, X } from "lucide-react";
import { emptyApplication } from "./api";
import "./application-form.css";

function ApplicationForm({ application, onClose, onSave, isSaving }) {
  const [form, setForm] = useState(() => {
    if (!application) return emptyApplication();
    return {
      company: application.company,
      role: application.role,
      location: application.location || "",
      status: application.status,
      appliedAt: new Date(application.appliedAt).toISOString().slice(0, 10),
      notes: application.notes || "",
    };
  });

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  return (
    <div className="application-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="application-dialog" role="dialog" aria-modal="true" aria-labelledby="application-dialog-title">
        <div className="application-dialog-heading">
          <div>
            <p className="application-form-eyebrow">APPLICATION DETAILS</p>
            <h2 id="application-dialog-title">{application ? "Edit application" : "Add application"}</h2>
          </div>
          <button className="application-dialog-close" type="button" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>
        <form className="application-form" onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}>
          <div className="application-form-grid">
            <label>
              Company
              <input autoFocus name="company" required maxLength={120} value={form.company} onChange={updateField} placeholder="Company name" />
            </label>
            <label>
              Job title
              <input name="role" required maxLength={120} value={form.role} onChange={updateField} placeholder="e.g. Product Designer" />
            </label>
            <label>
              Date applied
              <input name="appliedAt" type="date" required value={form.appliedAt} onChange={updateField} />
            </label>
            <label className="form-field-wide">
              Location
              <input name="location" maxLength={120} value={form.location} onChange={updateField} placeholder="City, remote, or hybrid" />
            </label>
            <label className="form-field-wide">
              Notes
              <textarea name="notes" maxLength={2000} rows={3} value={form.notes} onChange={updateField} placeholder="Interview notes, contacts, or next steps" />
            </label>
          </div>
          <div className="application-dialog-actions">
            <button className="application-cancel-button" type="button" onClick={onClose}>Cancel</button>
            <button className="application-save-button" type="submit" disabled={isSaving}>
              {application ? <Save size={17} /> : <Plus size={17} />}
              {isSaving ? "Saving..." : application ? "Save changes" : "Add application"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default ApplicationForm;
