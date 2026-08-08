import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import Layout, { Crumb } from "../components/Layout";

export default function TubeMillsPage() {
  const { dept } = useParams();
  const [department, setDepartment] = useState(null);
  const [mills, setMills] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .getMills(dept)
      .then(({ department: d, mills: list }) => {
        setDepartment(d);
        setMills(list);
      })
      .catch((e) => {
        setDepartment(null);
        setMills([]);
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [dept]);

  if (loading) {
    return (
      <Layout title="Loading mills…">
        <p className="page-subtitle">Please wait</p>
      </Layout>
    );
  }

  if (error || !department) {
    return (
      <Layout title="Department not found">
        <Link to="/departments">← Back to departments</Link>
      </Layout>
    );
  }

  return (
    <Layout
      breadcrumb={
        <Crumb items={[{ to: "/departments", label: "Departments" }, { label: department.label }]} />
      }
      title={`${department.label} tube mills`}
      subtitle="Select a mill to file an issue report"
    >
      {!mills.length && <p className="page-subtitle">No mills configured for this department.</p>}
      <div className="grid-mills">
        {mills.map((m) => (
          <Link
            key={m.id}
            to={`/departments/${dept}/mills/${m.slug}/report`}
            className="mill-card"
          >
            <span className="mill-num">{m.slug}</span>
            <h3>{m.label}</h3>
            <span>Report issue</span>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
