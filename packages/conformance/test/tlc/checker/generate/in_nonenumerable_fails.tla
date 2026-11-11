(*---
description: -generate of x' \in Nat fails like -simulate.
ref: tlc2/tool/impl/Tool.java#getNextStatesAppl
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
args:
  - -generate
  - num=1
  - -depth
  - "1"
---*)
---- MODULE in_nonenumerable_fails ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' \in Nat
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : In computing next states, the right side of \IN is not enumerable.
    line 18, col 9 to line 18, col 18 of module in_nonenumerable_fails
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 17, col 9 to line 17, col 13 of module in_nonenumerable_fails>
    x = 0
    2209:0 Progress(1) at <date>: 1 states generated, -1 distinct states found, -1 states left on queue.
---*)
