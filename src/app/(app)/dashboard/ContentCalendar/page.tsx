// Stand-alone route to preview the Content Calendar: /dashboard/ContentCalendar
// (The same component is used inside the client details "Content Calendar" tab.)
import ContentCalendar from "../Clients/[id]/components/ContentCalendar/ContentCalendar";

export default function ContentCalendarPage() {
  return <ContentCalendar clientId="demo" />;
}
