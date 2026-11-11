(*---
description: A list of names may span lines, and the later name still counts.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANTS
    A
    B
---*)
---- MODULE invariants_split_over_lines ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
A == x < 3
B == x < 1
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
    2217:4 2: <Next line 16, col 9 to line 16, col 24 of module invariants_split_over_lines>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
