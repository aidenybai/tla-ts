(*---
description: 'With several successors the first sink in BFS order wins.'
ref: tlc2/tool/liveness/LiveCheck.java#printErrorTrace
features: [liveness]
outcome: safety-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE safety_like_branching_finds_shortest_prefix ----
EXTENDS Naturals, TLC
VARIABLE x
Next == x < 3 /\ x' \in {x + 1, x + 2}
Spec == x = 0 /\ [][Next]_x
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
    x = 0
    2217:4 2: <Next line 14, col 9 to line 14, col 38 of module safety_like_branching_finds_shortest_prefix>
    x = 1
    2217:4 3: <Next line 14, col 9 to line 14, col 38 of module safety_like_branching_finds_shortest_prefix>
    x = 2
    2199:0 7 states generated, 5 distinct states found, 2 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
