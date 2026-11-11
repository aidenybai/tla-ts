(*---
description: After a violation with a trace of two or more states, TLC names the trace spec it wrote.
ref: tlc2/TraceExplorationSpec.java#generate
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -generateSpecTE
  - -teSpecOutDir
  - te.tla
---*)
---- MODULE written_after_violation ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == x < 1
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
    2217:4 2: <Next line 18, col 9 to line 18, col 24 of module written_after_violation>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2501:0 Trace exploration spec path: ./te.tla
---*)
