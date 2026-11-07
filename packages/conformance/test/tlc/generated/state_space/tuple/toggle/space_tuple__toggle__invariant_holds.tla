(*---
description: Explores init tuple and next toggle with check invariant_holds.
ref: tlc2/tool/impl/Tool.java#getInitStates; tlc2/tool/impl/Tool.java#getNextStates
features:
  - state-space
outcome: any
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE space_tuple__toggle__invariant_holds ----
EXTENDS Integers
VARIABLES x, y
vars == <<x, y>>
Assign(a, b) == x = a /\ y = b
Same(a, b) == a = a /\ b = b
Init == <<x, y>> = <<0, 1>>
Next == x' = x /\ y' = IF y = 0 THEN 1 ELSE 0
Inv == TRUE
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2149:3 The invariant Inv is a constant-level formula (i.e., it contains no variables, primes, or temporal operators) and evaluates to TRUE. To assert constant-level formulas in your spec, use ASSUME ConstInv. If you optionally want to give the assumption a name, write ASSUME YourAssumption == ConstInv instead. See https://explain.tlapl.us/assumptions-and-invariants for additional details.
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 18, col 11 to line 18, col 11 of module space_tuple__toggle__invariant_holds
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 18, col 11 to line 18, col 11 of module space_tuple__toggle__invariant_holds
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 18, column 9 to line 18, column 27 in space_tuple__toggle__invariant_holds
    1. Line 18, column 9 to line 18, column 16 in space_tuple__toggle__invariant_holds
    2. Line 18, column 11 to line 18, column 11 in space_tuple__toggle__invariant_holds
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
