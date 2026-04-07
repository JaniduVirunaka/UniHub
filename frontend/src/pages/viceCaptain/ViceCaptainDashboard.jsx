import { Medal, ClipboardList, Users } from "lucide-react";
import PageWrapper from "../../components/PageWrapper";
import StatCard from "../../components/StatCard";
import ActionCard from "../../components/ActionCard";

function ViceCaptainDashboard() {
  return (
    <PageWrapper
      title="Vice Captain Dashboard"
      subtitle="Support your sport leadership by helping review and manage requests."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Role"
          value="Vice Captain"
          subtitle="Support the sport leadership team"
          icon={<Medal size={22} />}
          delay={0}
        />
        <StatCard
          title="Access"
          value="Requests"
          subtitle="View and process team join applications"
          icon={<ClipboardList size={22} />}
          delay={0.05}
        />
        <StatCard
          title="Focus"
          value="Team Support"
          subtitle="Help keep the sport team organized"
          icon={<Users size={22} />}
          delay={0.1}
        />
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <ActionCard
          to="/vice-captain/requests"
          title="Manage Requests"
          text="Support request approvals and review incoming student applications."
          icon={<ClipboardList size={22} />}
          delay={0}
        />
      </div>
    </PageWrapper>
  );
}

export default ViceCaptainDashboard;