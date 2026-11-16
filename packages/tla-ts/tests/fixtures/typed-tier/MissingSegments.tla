---- MODULE MissingSegments ----
EXTENDS Naturals, Sequences
CONSTANTS None, Reach
VARIABLES segments, log
Read(i) == IF i \in DOMAIN segments THEN segments[i] ELSE None
Init == segments = <<>> /\ log = <<>>
Write ==
  /\ Len(segments) < 3
  /\ \E v \in {1, 2} : segments' = Append(segments, <<v, v + 1>>)
  /\ UNCHANGED log
Replay ==
  /\ Len(log) < 4
  /\ \E i \in 1..Reach : (i <= Len(segments) + Reach - 3) /\ log' = log \o Read(i)
  /\ UNCHANGED segments
Next == Write \/ Replay
====
