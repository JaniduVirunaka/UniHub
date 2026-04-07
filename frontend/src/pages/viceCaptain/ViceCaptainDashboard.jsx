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
          title="Module"
          value="Sports"
          subtitle="Assist your captain"
          icon={<Users size={22} />}
          delay={0.05}
        />
        <StatCard
          title="Actions"
          value="1"
          subtitle="Review join requests"
          icon={<ClipboardList size={22} />}
          delay={0.1}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <ActionCard
          to="/vice-captain/requests"
          title="View Requests"
          text="Help review student join requests and support the captain's workflow."
          icon={<ClipboardList size={22} />}
          delay={0.15}
        />
      </div>
    </PageWrapper>
  );
}

export default ViceCaptainDashboard;
