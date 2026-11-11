(*---
description: Invariants are checked in the order the file lists them, so the first listed false one is named, even from separate sections.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInvariants
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT B
  INVARIANT A
---*)
---- MODULE first_invariant_listed_is_checked_first ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
A == x = 0
B == x = 0
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant B is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 15, col 9 to line 15, col 24 of module first_invariant_listed_is_checked_first>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
