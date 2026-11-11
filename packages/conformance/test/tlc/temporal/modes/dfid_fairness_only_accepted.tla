(*---
description: 'Fairness alone leaves livenessIsTrue, so -dfid runs and never looks at it.'
ref: tlc2/tool/DFIDModelChecker.java#DFIDModelChecker
features: [liveness]
outcome: success
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
args:
  - -dfid
  - 4
---*)
---- MODULE dfid_fairness_only_accepted ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x /\ WF_x(Next)
Prop == TRUE
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2208:0 Finished computing initial states: 1 states generated, with 1 of them distinct.
    2205:0 Starting level 2: 1 states generated, 1 distinct states found.
    2205:0 Starting level 3: 2 states generated, 2 distinct states found.
    2205:0 Starting level 4: 4 states generated, 3 distinct states found.
    2206:0 Progress(-1) at <date>: 6 states generated, 3 distinct states found, -1 states left on queue.
    2204:0 6 states generated, 3 distinct states found.
---*)
