import { useEffect, useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, CalendarCheck, ChartNoAxesColumnIncreasing, CircleCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "../../components/ui/toast-context";
import { apiRequest, applicationStatuses, statusLabels } from "../applications/api";
import "./overview.css";

const stageColors = {
  Applied: "#6b16c4",
  Interview: "#2f8528",
  Offer: "#d6a400",
  Declined: "#b64d45",
};

function getMonthSeries(applications) {
  const today = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1);
    const count = applications.filter((application) => {
      const appliedDate = new Date(application.appliedAt);
      return appliedDate.getFullYear() === date.getFullYear() && appliedDate.getMonth() === date.getMonth();
    }).length;
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: new Intl.DateTimeFormat("en", { month: "short" }).format(date),
      count,
    };
  });
}

function Dashboard() {
  const toast = useToast();
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiRequest("/api/applications")
      .then((result) => {
        if (isMounted) setApplications(result.applications);
      })
      .catch((error) => {
        if (isMounted) toast(error.message, "error");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [toast]);

  const stageCounts = applicationStatuses.map((status) => ({
    status,
    label: statusLabels[status],
    count: applications.filter((application) => application.status === status).length,
  }));
  const maxStageCount = Math.max(1, ...stageCounts.map((stage) => stage.count));
  const total = applications.length;
  const interviewCount = stageCounts.find((stage) => stage.status === "Interview").count;
  const offerCount = stageCounts.find((stage) => stage.status === "Offer").count;
  const activeCount = stageCounts
    .filter((stage) => stage.status === "Applied" || stage.status === "Interview")
    .reduce((sum, stage) => sum + stage.count, 0);
  const responseCount = total - stageCounts.find((stage) => stage.status === "Applied").count;
  const responseRate = total ? Math.round((responseCount / total) * 100) : 0;
  const monthSeries = getMonthSeries(applications);
  const maxMonthCount = Math.max(1, ...monthSeries.map((month) => month.count));

  const metrics = [
    { label: "Total applications", value: total, note: "Roles in your pipeline", Icon: BriefcaseBusiness, color: "violet" },
    { label: "Active applications", value: activeCount, note: "Applied or interviewing", Icon: ChartNoAxesColumnIncreasing, color: "green" },
    { label: "Interviews", value: interviewCount, note: "Hiring conversations", Icon: CalendarCheck, color: "gold" },
    { label: "Offers", value: offerCount, note: "Offers received", Icon: CircleCheck, color: "coral" },
  ];

  return (
    <main className="overview-page">
      <div className="overview-intro">
        <div>
          <p className="overview-eyebrow">YOUR JOB SEARCH</p>
          <h2>Overview</h2>
          <p>A clear, high-level view of your application progress.</p>
        </div>
        <Link className="overview-board-link" to="/applications">
          <span>Open Kanban board</span>
          <ArrowUpRight size={17} />
        </Link>
      </div>

      {isLoading ? (
        <div className="overview-loading" role="status">Loading your statistics...</div>
      ) : (
        <>
          <section className="overview-metrics" aria-label="Application statistics">
            {metrics.map(({ label, value, note, Icon, color }, index) => (
              <article className="overview-metric" key={label} style={{ animationDelay: `${index * 70}ms` }}>
                <span className={`overview-metric-icon ${color}`}><Icon size={19} /></span>
                <span className="overview-metric-label">{label}</span>
                <strong>{value}</strong>
                <small>{note}</small>
              </article>
            ))}
          </section>

          <div className="overview-charts">
            <section className="overview-chart-panel" aria-labelledby="stage-chart-title">
              <div className="overview-panel-heading">
                <div>
                  <p className="overview-eyebrow">CURRENT PIPELINE</p>
                  <h3 id="stage-chart-title">Applications by stage</h3>
                </div>
                <span className="overview-total">{total} total</span>
              </div>
              <div className="stage-chart" role="img" aria-label="Application counts by hiring stage">
                {stageCounts.map(({ status, label, count }, index) => (
                  <div className="stage-chart-row" key={status}>
                    <span className="stage-chart-label">{label}</span>
                    <div className="stage-chart-track">
                      <span
                        className="stage-chart-bar"
                        style={{ width: `${(count / maxStageCount) * 100}%`, backgroundColor: stageColors[status], animationDelay: `${index * 90}ms` }}
                      />
                    </div>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="overview-chart-panel monthly-panel" aria-labelledby="monthly-chart-title">
              <div className="overview-panel-heading">
                <div>
                  <p className="overview-eyebrow">APPLICATION ACTIVITY</p>
                  <h3 id="monthly-chart-title">Last six months</h3>
                </div>
              </div>
              <div className="monthly-chart" role="img" aria-label="Applications created in the last six months">
                {monthSeries.map(({ key, label, count }, index) => (
                  <div className="monthly-chart-column" key={key} title={`${label}: ${count} applications`}>
                    <strong>{count}</strong>
                    <div className="monthly-chart-track">
                      <span style={{ height: `${(count / maxMonthCount) * 100}%`, animationDelay: `${index * 75}ms` }} />
                    </div>
                    <small>{label}</small>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="overview-response" aria-label="Response rate statistics">
            <div>
              <p className="overview-eyebrow">SEARCH MOMENTUM</p>
              <h3>Applications that moved beyond submission</h3>
              <p>Interviews, offers, or closed decisions compared with total applications.</p>
            </div>
            <div className="response-rate">
              <strong>{responseRate}%</strong>
              <span>{responseCount} of {total} applications</span>
            </div>
            <div className="response-track" aria-hidden="true">
              <span style={{ width: `${responseRate}%`, animationDelay: "400ms" }} />
            </div>
          </section>
        </>
      )}
    </main>
  );
}

export default Dashboard;
