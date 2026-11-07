(*---
description: "RTBound is defined with \\EE t, which TLC does not support: as a property it is rejected."
ref: tla2sany/StandardModules/RealTime.tla#RTBound
features:
  - RealTime
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY Bound
---*)
---- MODULE rtbound_temporal_quantifier ----
EXTENDS RealTime
VARIABLE x
Init == x = 0 /\ now = 0
Next == x' = 1 - x /\ now' = now
Spec == Init /\ [][Next]_<<x, now>>
Bound == RTBound(x' = 1, x, 0, 1)
====

(*--- recorded
all:
  exit: 255
  transcript: 2213:1 TLC cannot handle the temporal formula line 20, col 6 to line 20, col 49 of module RealTime
---*)
