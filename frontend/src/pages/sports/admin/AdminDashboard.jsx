import { ShieldCheck, Trophy, Users, ClipboardList, PlusCircle, Settings } from "lucide-react";
import PageWrapper from "../../../components/PageWrapper";
import StatCard from "../../../components/StatCard";
import ActionCard from "../../../components/ActionCard";

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
          title="Module"
          value="Sports"
          subtitle="Manage all university sports"
          icon={<Trophy size={22} />}
          delay={0.05}
        />
        <StatCard
          title="Actions"
          value="4"
          subtitle="Available admin operations"
          icon={<Settings size={22} />}
          delay={0.1}
        />
        <StatCard
          title="Team"
          value="Leaders"
          subtitle="Assign captains and vice captains"
          icon={<Users size={22} />}
          delay={0.15}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ActionCard
          to="/admin/create-sport"
          title="Create Sport"
          text="Add a new sport to the platform with details and category."
          icon={<PlusCircle size={22} />}
          delay={0.2}
        />
        <ActionCard
          to="/admin/manage-sports"
          title="Manage Sports"
          text="Edit or remove existing sports from the system."
          icon={<Trophy size={22} />}
          delay={0.25}
        />
        <ActionCard
          to="/admin/requests"
          title="Manage Requests"
          text="Review and approve or reject student join requests."
          icon={<ClipboardList size={22} />}
          delay={0.3}
        />
        <ActionCard
          to="/admin/team"
          title="Manage Team"
          text="Assign captains, vice captains, and manage team members."
          icon={<Users size={22} />}
          delay={0.35}
        />
      </div>
    </PageWrapper>
  );
}

export default AdminDashboard;
