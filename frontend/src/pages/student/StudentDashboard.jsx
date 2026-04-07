import { Search, Send, FileClock, UserCircle } from "lucide-react";
import PageWrapper from "../../components/PageWrapper";
import StatCard from "../../components/StatCard";
import ActionCard from "../../components/ActionCard";

function StudentDashboard() {
  return (
    <PageWrapper
      title="Student Dashboard"
      subtitle="Explore available sports, submit join requests, and track your request progress."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Role"
          value="Student"
          subtitle="Apply to join sports you are interested in"
          icon={<UserCircle size={22} />}
          delay={0}
        />
        <StatCard
          title="Browse"
          value="Sports"
          subtitle="Discover all available sport teams"
          icon={<Search size={22} />}
          delay={0.05}
        />
        <StatCard
          title="Action"
          value="Request"
          subtitle="Submit your details to join a sport"
          icon={<Send size={22} />}
          delay={0.1}
        />
        <StatCard
          title="Tracking"
          value="Status"
          subtitle="Check pending, approved, or rejected requests"
          icon={<FileClock size={22} />}
          delay={0.15}
        />
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <ActionCard
          to="/student/sports"
          title="View Sports"
          text="Open the sports list, explore teams, and submit join requests."
          icon={<Search size={22} />}
          delay={0}
        />
        <ActionCard
          to="/student/my-requests"
          title="My Requests"
          text="Track the status of your sport join applications."
          icon={<FileClock size={22} />}
          delay={0.05}
        />
      </div>
    </PageWrapper>
  );
}

export default StudentDashboard;