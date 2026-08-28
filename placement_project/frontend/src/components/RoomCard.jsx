import React from "react";
import { DoorOpen, Users2 } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { pick } from "../utils/normalize";

export default function RoomCard({ room }) {
  const name = pick(room, ["name", "roomName"], "Room");
  const location = pick(room, ["location", "building", "floor"]);
  const capacity = pick(room, ["capacity", "seats"]);

  return (
    <div className="entity-card" style={{ "--accent": "var(--amber)" }}>
      <div className="entity-card-top">
        <h4><DoorOpen size={14} style={{ marginRight: 6, verticalAlign: -2 }} />{name}</h4>
        <StatusBadge status={room.status || (room.available === false ? "Closed" : "Open")} />
      </div>
      <div className="meta-row">
        {location && <span>{location}</span>}
        {capacity !== undefined && <span><Users2 size={13} /> Seats {capacity}</span>}
      </div>
    </div>
  );
}
