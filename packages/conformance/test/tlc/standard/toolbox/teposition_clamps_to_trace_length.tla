(*---
description: _TEPosition follows TLCGet("level") and stops at the trace length.
ref: tla2sany/StandardModules/Toolbox.tla#_TEPosition
features:
  - Toolbox
outcome: success
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  CONSTANT _TETrace <- Trc
---*)
---- MODULE teposition_clamps_to_trace_length ----
EXTENDS Toolbox, Naturals, TLC
VARIABLE x
Trc == <<"a", "b">>
Init == x = 0
Next == x' = IF x < 3 THEN x + 1 ELSE x
Inv == PrintT(<<x, _TEPosition>>)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | <<0, 1>>
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | <<1, 2>>
    | <<2, 2>>
    | <<3, 2>>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 2.2E-19
    2199:0 5 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 4.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
