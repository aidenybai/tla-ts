(*---
description: A constant expression in an invariant prints once over the whole run.
ref: tlc2/module/TLCEval.java#tlcEvalConst
features:
  - TLCEval
outcome: success
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE constant_in_invariant_prints_once ----
EXTENDS TLC, Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == TLCEval(Print("once", 7)) = 7
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | "once"  7
    2149:3 The invariant Inv is a constant-level formula (i.e., it contains no variables, primes, or temporal operators) and evaluates to TRUE. To assert constant-level formulas in your spec, use ASSUME ConstInv. If you optionally want to give the assumption a name, write ASSUME YourAssumption == ConstInv instead. See https://explain.tlapl.us/assumptions-and-invariants for additional details.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.6E-19
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
