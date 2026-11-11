(*---
description: '-dfid refuses to check liveness: the assertion in its constructor fails with TLC''s general error.'
ref: tlc2/tool/DFIDModelChecker.java#DFIDModelChecker
features: [liveness]
outcome: tlc-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
args:
  - -dfid
  - 4
---*)
---- MODULE dfid_rejects_temporal_property ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == <>(x = 2)
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    1000:1 Depth-First Iterative Deepening mode does not support checking liveness properties (https://github.com/tlaplus/tlaplus/issues/548).  Please check liveness properties in Breadth-First-Search mode.
---*)
