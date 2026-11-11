(*---
description: Explores init operator and next composition with check invariant_holds.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE space_operator__composition__invariant_holds ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == Assign(0, 0)
Next == (x' = x /\ y' = y) \cdot (x' = x /\ y' = y)
Inv == TRUE
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2149:3 The invariant Inv is a constant-level formula (i.e., it contains no variables, primes, or temporal operators) and evaluates to TRUE. To assert constant-level formulas in your spec, use ASSUME ConstInv. If you optionally want to give the assumption a name, write ASSUME YourAssumption == ConstInv instead. See https://explain.tlapl.us/assumptions-and-invariants for additional details.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : The current version of TLC does not support action composition.  An incomplete implementation can be enabled via the tlc2.tool.impl.Tool.cdot=true java property.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 19, column 51 in space_operator__composition__invariant_holds
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
