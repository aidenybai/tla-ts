(*---
description: 'A VIEW that is temporal has no level check at startup and fails when evaluated.'
ref: tlc2/tool/impl/Tool.java#eval
features: [liveness, levels]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  VIEW Vw
---*)
---- MODULE tlc_view_temporal ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
Vw == <>(x = 1)
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2261:0 TLC encountered a temporal formula (<>A) when evaluating a predicate or action.
    line 15, col 7 to line 15, col 15 of module tlc_view_temporal
    | While working on the initial state:
    | x = 0
    2261:0 TLC encountered a temporal formula (<>A) when evaluating a predicate or action.
    line 15, col 7 to line 15, col 15 of module tlc_view_temporal
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 13 in tlc_view_temporal
    2199:0 1 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
