(*---
description: An -inv expression may use the spec's definitions.
ref: tlc2/tool/impl/ParameterizedSpecObj.java#getInvariants
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
args:
  - -inv
  - x < D
---*)
---- MODULE uses_a_definition ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
D == 2
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant __DebuggerExpr__<id> is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 16, col 9 to line 16, col 24 of module uses_a_definition>
    x = 1
    2217:4 3: <Next line 16, col 9 to line 16, col 24 of module uses_a_definition>
    x = 2
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
