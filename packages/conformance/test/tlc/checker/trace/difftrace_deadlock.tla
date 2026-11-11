(*---
description: -difftrace applies to a deadlock trace too.
ref: tlc2/tool/TLCStateMut.java#toString
outcome: deadlock
config: |
  INIT Init
  NEXT Next
args:
  - -difftrace
---*)
---- MODULE difftrace_deadlock ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == x < 2 /\ x' = x + 1 /\ y' = y
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2217:4 2: <Next line 15, col 9 to line 15, col 37 of module difftrace_deadlock>
    /\ x = 1
    2217:4 3: <Next line 15, col 9 to line 15, col 37 of module difftrace_deadlock>
    /\ x = 2
    /\ y = 0
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
