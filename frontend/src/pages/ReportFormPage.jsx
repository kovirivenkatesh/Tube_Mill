import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import Layout, { Crumb } from "../components/Layout";
import SupervisorEmailModal from "../components/SupervisorEmailModal";
import ReportImageAttachments, { SubmissionImages } from "../components/ReportImageAttachments";
import DynamicReportFields from "../components/DynamicReportFields";
import { useToast } from "../components/Toast";

export default function ReportFormPage() {
  const { dept, mill } = useParams();
  const navigate = useNavigate();
  const { user, setUserFromServer } = useAuth();
  const { showToast } = useToast();

  const [department, setDepartment] = useState(null);
  const [millInfo, setMillInfo] = useState(null);
  const [formFields, setFormFields] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [configError, setConfigError] = useState("");
  const [configLoading, setConfigLoading] = useState(true);

  const [images, setImages] = useState([]);
  const [submittedImages, setSubmittedImages] = useState([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  const [status, setStatus] = useState("pending");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [supervisorComment, setSupervisorComment] = useState("");

  useEffect(() => {
    setConfigLoading(true);
    setConfigError("");
    Promise.all([api.getMills(dept), api.getFormFields()])
      .then(([{ department: d, mills }, { fields }]) => {
        const m = mills.find((x) => x.slug === String(mill));
        if (!d || !m) {
          setConfigError("Department or mill not found.");
          return;
        }
        setDepartment(d);
        setMillInfo(m);
        setFormFields(fields);
        const initial = {};
        fields.forEach((f) => {
          initial[f.fieldKey] = "";
        });
        setFormValues(initial);
      })
      .catch((e) => setConfigError(e.message))
      .finally(() => setConfigLoading(false));
  }, [dept, mill]);

  useEffect(() => {
    if (!submissionId) return;
    const interval = setInterval(async () => {
      try {
        const { submission } = await api.getSubmission(submissionId);
        setSupervisorComment(submission.supervisorComment || "");
        setStatus((prev) => {
          if (prev === "pending" && submission.status === "approved") {
            showToast("Supervisor approved your report.", "success");
          }
          if (prev === "pending" && submission.status === "rejected") {
            showToast("Supervisor rejected your report.", "error");
          }
          return submission.status;
        });
        if (submission.status === "approved" || submission.status === "rejected") {
          clearInterval(interval);
        }
      } catch {
        /* ignore */
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [submissionId, showToast]);

  function updateField(key, value) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }

  function openSupervisorModal(e) {
    e.preventDefault();
    setError("");
    setModalError("");
    setModalOpen(true);
  }

  async function confirmSend(supervisorEmails) {
    setModalError("");
    setLoading(true);
    try {
      const result = await api.createSubmission({
        departmentSlug: dept,
        millSlug: mill,
        formData: formValues,
        supervisorEmails,
        images,
      });
      if (result.user) setUserFromServer(result.user);
      setSubmissionId(result.submission.id);
      setSubmittedImages(result.submission.images || images);
      setStatus(result.submission.status);
      const sent =
        result.submission.supervisorEmails?.join(", ") ||
        result.submission.supervisorEmail ||
        supervisorEmails.join(", ");
      setSentTo(sent);
      setInfo(`Email sent from ${user?.email} to ${sent}.`);
      setModalOpen(false);
      showToast("Report submitted and approval email sent.", "success");
    } catch (err) {
      setModalError(err.message);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  if (configLoading) {
    return (
      <Layout title="Loading form…">
        <p className="page-subtitle">Please wait</p>
      </Layout>
    );
  }

  if (configError || !department || !millInfo) {
    return (
      <Layout title="Invalid route">
        <p className="page-subtitle">{configError || "This report link is not valid."}</p>
        <Link to="/departments">← Back</Link>
      </Layout>
    );
  }

  return (
    <Layout
      breadcrumb={
        <Crumb
          items={[
            { to: "/departments", label: "Departments" },
            { to: `/departments/${dept}/mills`, label: department.label },
            { label: millInfo.label },
          ]}
        />
      }
      title={`Issue report · ${millInfo.label}`}
      subtitle={`${department.label} — fill details and send to supervisor`}
    >
      <SupervisorEmailModal
        open={modalOpen}
        initialEmail={user?.supervisorEmail || ""}
        onClose={() => !loading && setModalOpen(false)}
        onConfirm={confirmSend}
        loading={loading}
        error={modalError}
      />

      {submissionId ? (
        <div className="card">
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <h3 style={{ margin: 0 }}>Submission received</h3>
            <span className={`status-badge status-${status}`}>{status}</span>
          </header>
          <p className="card-subtitle" style={{ marginBottom: 0 }}>
            {status === "pending"
              ? `Waiting for supervisor (${sentTo}) to approve or reject via the email link. This page updates automatically.`
              : status === "approved"
                ? "Your supervisor approved this report."
                : "Your supervisor rejected this report."}
          </p>
          {supervisorComment && status !== "pending" && (
            <p className="submission-supervisor-comment" style={{ marginTop: 12 }}>
              <strong>Supervisor comment:</strong> {supervisorComment}
            </p>
          )}
          {info && <div className="info-banner" style={{ marginTop: 16 }}>{info}</div>}
          <SubmissionImages images={submittedImages} />
          <div className="actions-row">
            <Link to="/my-reports" className="btn btn-primary" style={{ textDecoration: "none" }}>
              My reports
            </Link>
            <button type="button" className="btn btn-ghost" onClick={() => navigate("/departments")}>
              Home
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={openSupervisorModal}>
            <DynamicReportFields
              fields={formFields}
              values={formValues}
              onChange={updateField}
              readOnlyBlocks={[
                { id: "dept-ro", label: "Department", value: department.label },
                { id: "mill-ro", label: "Mill", value: millInfo.label },
              ]}
            />
            <ReportImageAttachments images={images} onChange={setImages} />
            <button type="submit" className="btn btn-primary">
              Submit to supervisor
            </button>
          </form>
        </div>
      )}
    </Layout>
  );
}
