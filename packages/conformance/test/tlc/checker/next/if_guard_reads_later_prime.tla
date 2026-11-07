(*---
description: An IF guard can't read a primed variable that is assigned later.
ref: tlc2/tool/impl/Tool.java#getNextStatesApplSwitch OPCODE_ite
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE if_guard_reads_later_prime ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == (IF x' = 1 THEN y' = 10 ELSE y' = 20) /\ x' = 1
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
    : @!@!@STARTMSG 2280:0 @!@!@
    In evaluation, the identifier x is either undefined or not an operator.
    line 13, col 13 to line 13, col 13 of module if_guard_reads_later_prime
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : @!@!@STARTMSG 2280:0 @!@!@
    In evaluation, the identifier x is either undefined or not an operator.
    line 13, col 13 to line 13, col 13 of module if_guard_reads_later_prime
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 55 in if_guard_reads_later_prime
    1. Line 13, column 10 to line 13, column 44 in if_guard_reads_later_prime
    2. Line 13, column 13 to line 13, column 18 in if_guard_reads_later_prime
    3. Line 13, column 13 to line 13, column 14 in if_guard_reads_later_prime
    4. Line 13, column 13 to line 13, column 13 in if_guard_reads_later_prime
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
