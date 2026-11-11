(*---
description: 'A []P property is an invariant in -dfid mode, too.'
ref: tlc2/tool/DFIDModelChecker.java#DFIDModelChecker
features: [liveness]
outcome: safety-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
args:
  - -dfid
  - 4
---*)
---- MODULE dfid_invariant_form_checked ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == [](x < 2)
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2208:0 Finished computing initial states: 1 states generated, with 1 of them distinct.
    2205:0 Starting level 2: 1 states generated, 1 distinct states found.
    2205:0 Starting level 3: 2 states generated, 2 distinct states found.
    2110:1 Invariant Prop is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: 
    x = 0
    2217:4 2: 
    x = 1
    2217:4 3: 
    x = 2
    2206:0 Progress(-1) at <date>: 4 states generated, 3 distinct states found, -1 states left on queue.
    2204:0 4 states generated, 3 distinct states found.
---*)
