(*---
description: A violation trace prints the state's variables, not the view.
ref: tlc2/tool/TLCStateMut.java#fingerPrint
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  VIEW V
---*)
---- MODULE violation_prints_state ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = x + 1
Inv == x < 2
V == x
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 15, col 9 to line 15, col 18 of module violation_prints_state>
    x = 1
    2217:4 3: <Next line 15, col 9 to line 15, col 18 of module violation_prints_state>
    x = 2
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
