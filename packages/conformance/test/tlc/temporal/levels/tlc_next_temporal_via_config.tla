(*---
description: 'A NEXT with a temporal formula fails in action splitting or generation.'
ref: tlc2/tool/impl/Tool.java#getNextStates
features: [liveness, levels]
outcome: evaluation-failure
config: |
  INIT I
  NEXT N
---*)
---- MODULE tlc_next_temporal_via_config ----
EXTENDS Naturals
VARIABLE x
Next == x < 2 /\ x' = x + 1
Spec == x = 0 /\ [][Next]_x
N == <>(x = 0)
I == x = 0
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2261:0 TLC encountered a temporal formula (<>A) when evaluating a predicate or action.
    line 15, col 6 to line 15, col 14 of module tlc_next_temporal_via_config
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 6 to line 15, column 14 in tlc_next_temporal_via_config
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
