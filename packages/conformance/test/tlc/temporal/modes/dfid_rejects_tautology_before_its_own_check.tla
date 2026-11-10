(*---
description: 'The same assertion runs before DFID''s tautology check, which therefore cannot be reached.'
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
---- MODULE dfid_rejects_tautology_before_its_own_check ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == <>[]TRUE => TRUE
====

(*--- recorded
all:
  exit: 255
  transcript: 1000:1 Depth-First Iterative Deepening mode does not support checking liveness properties (https://github.com/tlaplus/tlaplus/issues/548).  Please check liveness properties in Breadth-First-Search mode.
---*)
