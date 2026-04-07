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
          title="Module"
          value="Sports"
          subtitle="Browse and join university sports"
          icon={<Search size={22} />}
          delay={0.05}
        />
        <StatCard
          title="Actions"
          value="3"
          subtitle="Sports, requests, and tracking"
          icon={<Send size={22} />}
          delay={0.1}
        />
        <StatCard
          title="Status"
          value="Active"
          subtitle="Check your request status anytime"
          icon={<FileClock size={22} />}
          delay={0.15}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <ActionCard
          to="/student/sports"
          title="Browse Sports"
          text="Explore all available sports and view details before applying."
          icon={<Search size={22} />}
          delay={0.2}
        />
        <ActionCard
          to="/student/my-requests"
          title="My Requests"
          text="Track the status of all your submitted join requests."
          icon={<FileClock size={22} />}
          delay={0.25}
        />
      </div>
    </PageWrapper>
  );
}

export default StudentDashboard;
