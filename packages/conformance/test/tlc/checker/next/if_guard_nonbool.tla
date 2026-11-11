(*---
description: A non-Boolean IF guard has the next-states message, which runs into the expression because the source has no newline there.
ref: tlc2/tool/impl/Tool.java#getNextStatesApplSwitch OPCODE_ite
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE if_guard_nonbool ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == IF 1 THEN x' = 1 ELSE x' = 2
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
    : In computing next states, a non-boolean expression (an integer) was used as the condition of an IF.line 13, col 9 to line 13, col 36 of module if_guard_nonbool
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 36 in if_guard_nonbool
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
