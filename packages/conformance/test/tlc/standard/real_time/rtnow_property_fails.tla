(*---
description: RTnow quantifies over Real, the string "Reals", so TLC fails to process it as a property.
ref: tla2sany/StandardModules/RealTime.tla#RTnow
features:
  - RealTime
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  PROPERTY NowProp
---*)
---- MODULE rtnow_property_fails ----
EXTENDS RealTime
VARIABLE x
Init == x = 0 /\ now = 0
Next == x' = 1 - x /\ now' = now
Spec == Init /\ [][Next]_<<x, now>>
NowProp == RTnow(x)
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2213:1 TLC cannot handle the temporal formula line 26, col 20 to line 26, col 62 of module RealTime:
    TLC encountered a non-enumerable quantifier bound
    "Reals".
    line 26, col 29 to line 26, col 32 of module RealTime
---*)
