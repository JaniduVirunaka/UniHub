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
          title="Module"
          value="Sports"
          subtitle="Oversee your sport's team"
          icon={<Shield size={22} />}
          delay={0.05}
        />
        <StatCard
          title="Actions"
          value="1"
          subtitle="Manage incoming requests"
          icon={<ClipboardList size={22} />}
          delay={0.1}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <ActionCard
          to="/captain/requests"
          title="View Requests"
          text="Review student join requests for your sport and approve or reject them."
          icon={<ClipboardList size={22} />}
          delay={0.15}
        />
      </div>
    </PageWrapper>
  );
}

export default CaptainDashboard;
