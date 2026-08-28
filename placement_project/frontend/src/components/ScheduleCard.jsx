import React from "react";
import { CalendarClock, DoorOpen } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { pick } from "../utils/normalize";

export default function ScheduleCard({ item }) {
  const title = pick(
    item,
    ["title", "student.name", "candidateName"],
    "Interview"
  );

  // Interviews list shows every job's interviews together (admin view), so
  // without the job title two different candidates for two different roles
  // are indistinguishable at a glance.
  const jobTitle = pick(item, ["job.title", "jobTitle", "role"], "");

  const date = pick(item, ["date"], "");
  const time = pick(item, ["time", "slot"], "");

  const roomData = pick(
    item,
    ["room", "venue"],
    null
  );

  // Room can be either an object or a string
  const room =
    typeof roomData === "object" && roomData !== null
      ? roomData.name || "Room TBD"
      : roomData || "Room TBD";

  return (
    <div
      className="entity-card"
      style={{ "--accent": "var(--amber)" }}
    >
      <div className="entity-card-top">
        <div>
          <h4>{title}</h4>
          {jobTitle && <div className="sub">{jobTitle}</div>}
        </div>

        <StatusBadge status={item.status || "Scheduled"} />
      </div>

      <div className="meta-row">
        <span>
          <CalendarClock size={13} />
          {date}
          {time ? ` · ${time}` : ""}
        </span>

        <span>
          <DoorOpen size={13} />
          {room}
        </span>
      </div>
    </div>
  );
}