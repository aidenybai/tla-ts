(*---
description: "A successor holding an infinite set fails with the message that a variable's value contains Nat, and the predecessor's behavior."
ref: tlc2/tool/TLCStateMut.java#fingerPrint
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE state_with_infinite_value_next ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = Nat
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
    : TLC has found a state in which the value of a variable contains Nat
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : TLC has found a state in which the value of a variable contains Nat
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
