(*---
description: '-difftrace applies to this path through getPreviousState.'
ref: tlc2/tool/liveness/LiveCheck.java#printErrorTrace
features: [liveness]
outcome: safety-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
args:
  - -difftrace
---*)
---- MODULE safety_like_difftrace ----
EXTENDS Naturals, TLC
VARIABLES x, y
Next == x < 2 /\ x' = x + 1 /\ y' = y
Spec == x = 0 /\ y = 0 /\ [][Next]_<<x, y>>
Prop == [](x = 1 => [](x = 1))
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2217:4 2: <Next line 16, col 9 to line 16, col 37 of module safety_like_difftrace>
    /\ x = 1
    2217:4 3: <Next line 16, col 9 to line 16, col 37 of module safety_like_difftrace>
    /\ x = 2
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
