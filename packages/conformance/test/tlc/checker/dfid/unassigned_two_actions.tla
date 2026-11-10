(*---
description: With several actions, -dfid names the action with the unassigned variable.
ref: tlc2/tool/DFIDModelChecker.java#doNext
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
args:
  - -dfid
  - "10"
---*)
---- MODULE unassigned_two_actions ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 0
A == x' = x /\ y' = y
B == x' = x
Next == A \/ B
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2208:0 Finished computing initial states: 1 states generated, with 1 of them distinct.
    2205:0 Starting level 2: 1 states generated, 1 distinct states found.
    2109:1 Successor state is not completely specified by action B of the next-state relation. The following variable is not defined: y.
    2121:1 The behavior up to this point is:
    2216:4 1:
    /\ x = 0
    /\ y = 0
    2216:4 2:
    /\ x = 0
    /\ y = null
    2206:0 Progress(-1) at <date>: 3 states generated, 1 distinct states found, -1 states left on queue.
    2204:0 3 states generated, 1 distinct states found.
---*)
