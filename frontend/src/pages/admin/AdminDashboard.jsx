import { ShieldCheck, Trophy, Users, ClipboardList, PlusCircle, Settings } from "lucide-react";
import PageWrapper from "../../components/PageWrapper";
import StatCard from "../../components/StatCard";
import ActionCard from "../../components/ActionCard";

function AdminDashboard() {
  return (
    <PageWrapper
      title="Sport Admin Dashboard"
      subtitle="Manage sports, requests, team leadership, and overall sport operations from one place."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Access Level"
          value="Admin"
          subtitle="Full control over the sports platform"
          icon={<ShieldCheck size={22} />}
          delay={0}
        />
        <StatCard
          title="Main Area"
          value="Sports"
          subtitle="Create and manage sports"
          icon={<Trophy size={22} />}
          delay={0.05}
        />
        <StatCard
          title="Team Control"
          value="Members"
          subtitle="Assign captains and manage players"
          icon={<Users size={22} />}
          delay={0.1}
        />
        <StatCard
          title="Workflow"
          value="Requests"
          subtitle="Review and approve student join requests"
          icon={<ClipboardList size={22} />}
          delay={0.15}
        />
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <ActionCard
          to="/admin/create-sport"
          title="Create Sport"
          text="Add a new sport with description and category details."
          icon={<PlusCircle size={22} />}
          delay={0}
        />
        <ActionCard
          to="/admin/manage-sports"
          title="Manage Sports"
          text="Edit or delete sports and keep your system organized."
          icon={<Settings size={22} />}
          delay={0.05}
        />
        <ActionCard
          to="/admin/requests"
          title="Manage Requests"
          text="Review student requests and accept or reject them."
          icon={<ClipboardList size={22} />}
          delay={0.1}
        />
        <ActionCard
          to="/admin/team"
          title="Manage Team"
          text="Assign captains, vice captains, and remove members."
          icon={<Users size={22} />}
          delay={0.15}
        />
      </div>
    </PageWrapper>
  );
}

export default AdminDashboard;