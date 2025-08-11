import React from "react";
import ActivityTable from "../components/ActivityTable";
import ActivityDetail from "../components/ActivityDetail";

export default function HistoryPage({ activities, selectedActivity, setSelectedActivity }) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 px-3 sm:px-6">
      <div className="w-full lg:w-2/3">
        <ActivityTable
          activities={activities}
          setSelectedActivity={setSelectedActivity}
          selectedActivity={selectedActivity}
        />
      </div>

      {selectedActivity && (
        <div className="w-full lg:w-1/3 mt-4 lg:mt-0 lg:sticky lg:top-24" style={{ alignSelf: 'flex-start' }}>
          <ActivityDetail activity={selectedActivity} onClose={() => setSelectedActivity(null)} />
        </div>
      )}
    </div>
  );
}

