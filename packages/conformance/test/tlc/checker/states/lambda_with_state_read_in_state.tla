(*---
description: A lazy function value in a state is evaluated when fingerprinted.
ref: tlc2/tool/TLCStateMut.java#fingerPrint
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE lambda_with_state_read_in_state ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = [i \in {0, 1} |-> 1 \div i]
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
