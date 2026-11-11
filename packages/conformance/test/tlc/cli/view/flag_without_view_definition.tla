(*---
description: -view with no VIEW in the file has no map to apply, so it changes nothing.
ref: tlc2/tool/TLCStateMut.java#toString
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -view
---*)
---- MODULE flag_without_view_definition ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Vw == x + 10
Inv == x < 2
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
    2217:4 2: <Next line 16, col 9 to line 16, col 24 of module flag_without_view_definition>
    x = 1
    2217:4 3: <Next line 16, col 9 to line 16, col 24 of module flag_without_view_definition>
    x = 2
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
