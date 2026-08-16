## Everyone draws this diagram differently

Ask ten robotics people to sketch an autonomous robot and you get ten boxes-and-arrows drawings, all roughly correct and none quite the same. Mine has settled into a shape I keep coming back to, and it is worth writing down because the shape encodes a set of opinions.

Three of them, really.

**Perception and decision are two columns, not one pipeline.** Sensor data flows *up* the left side, getting more abstract at every step: raw measurements become state estimates, estimates become maps, maps become objects and scenes. Decisions flow *down* the right side, getting more concrete: a mission becomes a plan, a plan becomes a trajectory, a trajectory becomes torque. Drawing it as one long chain hides the fact that these are different directions of travel.

**The two columns meet at a shared world model, not at each other.** This is the part I argue about most. If perception talks straight to planning, every new sensor becomes a new integration. Put a shared representation in the middle — the semantic and geometric map, robot state, occupancy, dynamic obstacles, goals — and both sides only ever have to agree with *it*.

**The whole thing runs on three clocks at once.** Roughly 0.1–10 Hz for deliberation, 10–50 Hz for reactive behaviour, and 100 Hz–1 kHz for reflexes. Most integration bugs I have chased were not logic errors. They were two components quietly assuming they lived in the same time band.

Watching over all of it is a supervisor: fault detection, plan validation, recovery, safety constraints. It is drawn across the diagram rather than inside a column because it is the one part that has to be allowed to interrupt anything.

{{figure}}

## Reading the diagram honestly

The highlighted blocks are where my own published and patented work actually sits — which also means the unhighlighted ones are places I depend on other people's work, and the diagram is more useful for showing that than for hiding it.

The other thing this drawing does not show is how long each block takes to become real. On paper, "real-time control" is one box. In practice it is the difference between a simulated flight and an aircraft you are willing to stand next to. Which is why the whole loop gets closed in simulation first, every time, before anything spins a propeller.
