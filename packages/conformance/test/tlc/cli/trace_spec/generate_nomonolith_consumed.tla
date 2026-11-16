(*---
description: -generateSpecTE consumes a following 'nomonolith', which would otherwise be a second input file.
ref: tlc2/TLC.java#handleParameters
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -generateSpecTE
  - nomonolith
  - -teSpecOutDir
  - te_out.tla
---*)
---- MODULE generate_nomonolith_consumed ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
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
    2217:4 2: <Next line 19, col 9 to line 19, col 24 of module generate_nomonolith_consumed>
    x = 1
    2217:4 3: <Next line 19, col 9 to line 19, col 24 of module generate_nomonolith_consumed>
    x = 2
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2501:0 Trace exploration spec path: ./te_out.tla
---*)
