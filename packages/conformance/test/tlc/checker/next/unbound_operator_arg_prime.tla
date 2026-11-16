(*---
description: A primed operator application reading an unassigned variable reports the variable, not the operator.
ref: tlc2/tool/impl/Tool.java#evalAppl OPCODE_prime
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE unbound_operator_arg_prime ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Op == x + 1
Next == Op' = 2
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
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 13, col 7 to line 13, col 7 of module unbound_operator_arg_prime
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 15 in unbound_operator_arg_prime
    1. Line 14, column 9 to line 14, column 11 in unbound_operator_arg_prime
    2. Line 14, column 9 to line 14, column 10 in unbound_operator_arg_prime
    3. Line 13, column 7 to line 13, column 11 in unbound_operator_arg_prime
    4. Line 13, column 7 to line 13, column 7 in unbound_operator_arg_prime
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
