(*---
description: A trace step with no change under -difftrace prints an empty state.
ref: tlc2/tool/TLCStateMut.java#toString
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
args:
  - -difftrace
---*)
---- MODULE difftrace_nothing_changed_in_step ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 0
A == x = 0 /\ y = 0 /\ x' = 0 /\ y' = 1
B == y = 1 /\ x' = 1 /\ y' = 1
Next == A \/ B
Inv == x = 0
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2217:4 2: <A line 16, col 6 to line 16, col 39 of module difftrace_nothing_changed_in_step>
    /\ y = 1
    2217:4 3: <B line 17, col 6 to line 17, col 30 of module difftrace_nothing_changed_in_step>
    /\ x = 1
    /\ y = 1
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
