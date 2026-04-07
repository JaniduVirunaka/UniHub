import { Crown, ClipboardList, Shield } from "lucide-react";
import PageWrapper from "../../components/PageWrapper";
import StatCard from "../../components/StatCard";
import ActionCard from "../../components/ActionCard";

function CaptainDashboard() {
  return (
    <PageWrapper
      title="Captain Dashboard"
      subtitle="Lead your assigned sport and help manage incoming student requests."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Role"
          value="Captain"
          subtitle="Team leadership responsibilities"
          icon={<Crown size={22} />}
          delay={0}
        />
        <StatCard
          title="Access"
          value="Requests"
          subtitle="Review requests for your assigned sport"
          icon={<ClipboardList size={22} />}
          delay={0.05}
        />
        <StatCard
          title="Responsibility"
          value="Leadership"
          subtitle="Support fair and quick request decisions"
          icon={<Shield size={22} />}
          delay={0.1}
        />
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <ActionCard
          to="/captain/requests"
          title="Manage Requests"
          text="Approve or reject requests for the sport you lead."
          icon={<ClipboardList size={22} />}
          delay={0}
        />
      </div>
    </PageWrapper>
  );
}

export default CaptainDashboard;