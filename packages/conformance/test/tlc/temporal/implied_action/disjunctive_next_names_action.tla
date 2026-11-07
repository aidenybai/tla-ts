(*---
description: 'The trace names the disjunct action taken, as Next is split.'
ref: tlc2/tool/Worker.java#doNextCheckImplied
features: [liveness, implied-action]
outcome: liveness-violation
config: |
  SPECIFICATION Spec2
  PROPERTY Prop
  CHECK_DEADLOCK FALSE
---*)
---- MODULE disjunctive_next_names_action ----
EXTENDS Naturals
VARIABLE x

A == x = 0 /\ x' = 1
C == x = 1 /\ x' = 2
N == A \/ C
Spec2 == x = 0 /\ [][N]_x
Prop == [][x' # 2]_x
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2112:1 Action property Prop is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <A line 15, col 6 to line 15, col 20 of module disjunctive_next_names_action>
    x = 1
    2217:4 3: <C line 16, col 6 to line 16, col 20 of module disjunctive_next_names_action>
    x = 2
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
