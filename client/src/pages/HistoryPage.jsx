import React from "react";
import ActivityTable from "../components/ActivityTable";
import ActivityDetail from "../components/ActivityDetail";

export default function HistoryPage({ activities, selectedActivity, setSelectedActivity }) {
  return (
    <div className="flex gap-6 justify-center">
      <div className="justify-center">
        <ActivityTable
          activities={activities}
          setSelectedActivity={setSelectedActivity}
          selectedActivity={selectedActivity}
        />
      </div>

      {selectedActivity && (
        <div className="sticky top-6" style={{ alignSelf: 'flex-start', flexGrow: 1 }}>
          <ActivityDetail activity={selectedActivity} onClose={() => setSelectedActivity(null)} />
        </div>
      )}
    </div>
  );
}

