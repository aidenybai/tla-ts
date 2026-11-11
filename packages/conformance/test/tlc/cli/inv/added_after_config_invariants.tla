(*---
description: Parameterized invariants come after the file's, so a false file invariant is reported first.
ref: tlc2/tool/impl/SpecProcessor.java#processConfig
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT First
args:
  - -inv
  - x < 1
---*)
---- MODULE added_after_config_invariants ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
First == x < 1
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant First is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 17, col 9 to line 17, col 24 of module added_after_config_invariants>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
