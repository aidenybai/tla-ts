(*---
description: Explores init membership and next tuple_prime with check invariant_holds.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE space_membership__tuple_prime__invariant_holds ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == x \in 0..1 /\ y \in {0}
Next == <<x, y>>' = <<x, y>>
Inv == TRUE
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2149:3 The invariant Inv is a constant-level formula (i.e., it contains no variables, primes, or temporal operators) and evaluates to TRUE. To assert constant-level formulas in your spec, use ASSUME ConstInv. If you optionally want to give the assumption a name, write ASSUME YourAssumption == ConstInv instead. See https://explain.tlapl.us/assumptions-and-invariants for additional details.
    2190:0 Finished computing initial states: 2 distinct states generated at <date>.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2280:0 @!@!@
    In evaluation, the identifier x is either undefined or not an operator.
    line 19, col 11 to line 19, col 11 of module space_membership__tuple_prime__invariant_holds
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2280:0 @!@!@
    In evaluation, the identifier x is either undefined or not an operator.
    line 19, col 11 to line 19, col 11 of module space_membership__tuple_prime__invariant_holds
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 19, column 28 in space_membership__tuple_prime__invariant_holds
    1. Line 19, column 9 to line 19, column 17 in space_membership__tuple_prime__invariant_holds
    2. Line 19, column 9 to line 19, column 16 in space_membership__tuple_prime__invariant_holds
    3. Line 19, column 11 to line 19, column 11 in space_membership__tuple_prime__invariant_holds
    2199:0 2 states generated, 2 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
