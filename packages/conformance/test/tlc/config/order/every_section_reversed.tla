(*---
description: A configuration with its sections in reverse of the documented order behaves the same.
ref: tlc2/tool/impl/ModelConfig.java#parse
outcome: success
config: |
  VIEW V
  ACTION_CONSTRAINT AC
  CONSTRAINT C
  INVARIANT Inv
  NEXT Next
  INIT Init
  CONSTANT N = 3
  CHECK_DEADLOCK FALSE
---*)
---- MODULE every_section_reversed ----
EXTENDS Naturals
CONSTANT N
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % N
Inv == x < N
C == x < 2
AC == x' < 2
V == x
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.1E-19
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
