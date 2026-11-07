(*---
description: An evaluation error in a VIEW on a successor is reported with the behavior.
ref: tlc2/tool/TLCStateMut.java#fingerPrint
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
  VIEW V
---*)
---- MODULE error_eval_next ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 4
V == 1 \div (1 - x)
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a tlc2.tool.EvalException
    : @!@!@STARTMSG 2179:0 @!@!@
    The second argument of \div is 0.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a tlc2.tool.EvalException
    : @!@!@STARTMSG 2179:0 @!@!@
    The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
        The error call stack is empty.
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
