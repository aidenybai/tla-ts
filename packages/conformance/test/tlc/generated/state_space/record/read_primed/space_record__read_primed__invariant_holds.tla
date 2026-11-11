(*---
description: Explores init record and next read_primed with check invariant_holds.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE space_record__read_primed__invariant_holds ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == x = [a |-> 0] /\ y = 0
Next == x' = x /\ y' = x'
Inv == TRUE
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2149:3 The invariant Inv is a constant-level formula (i.e., it contains no variables, primes, or temporal operators) and evaluates to TRUE. To assert constant-level formulas in your spec, use ASSUME ConstInv. If you optionally want to give the assumption a name, write ASSUME YourAssumption == ConstInv instead. See https://explain.tlapl.us/assumptions-and-invariants for additional details.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.1E-19
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
