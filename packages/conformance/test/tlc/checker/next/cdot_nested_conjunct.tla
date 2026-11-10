(*---
description: Action composition as a conjunct is rejected when generation reaches it.
ref: tlc2/tool/impl/Tool.java#getNextStatesApplSwitch OPCODE_cdot
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE cdot_nested_conjunct ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 0
A == x' = 1
B == x' = 2
Next == y' = 1 /\ (A \cdot B)
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
    : The current version of TLC does not support action composition.  An incomplete implementation can be enabled via the tlc2.tool.impl.Tool.cdot=true java property.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 29 in cdot_nested_conjunct
    1. Line 15, column 9 to line 15, column 14 in cdot_nested_conjunct
    2. Line 15, column 20 to line 15, column 28 in cdot_nested_conjunct
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
