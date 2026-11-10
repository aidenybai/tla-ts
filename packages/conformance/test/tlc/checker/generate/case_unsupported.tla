(*---
description: -generate doesn't handle CASE in an action and reports the unsupported operation.
ref: tlc2/tool/impl/Tool.java#getNextStatesAppl
features:
  - tlc-bug
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
args:
  - -generate
  - num=1
  - -depth
  - "4"
correct:
  all:
    exit: 0
    transcript: |-
      2269:0 Computed 1 initial states...
      2190:0 Finished computing initial states: 1 distinct state generated at <date>.
      2209:0 Progress(1) at <date>: 5 states generated, -1 distinct states found, -1 states left on queue.
      2209:0 Progress(1) at <date>: 5 states generated, -1 distinct states found, -1 states left on queue.
      2210:0 The number of states generated: 5
      Simulation using seed 4 and aril 0
---*)
---- MODULE case_unsupported ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == CASE x = 0 -> x' = 1 [] OTHER -> x' = 0
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
    The exception was a java.lang.UnsupportedOperationException
    : Probabilistic evaluation of next-state relation not implemented for CASE yet.
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 29, col 9 to line 29, col 13 of module case_unsupported>
    x = 0
    2209:0 Progress(1) at <date>: 1 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 1
    Simulation using seed 4 and aril 0
    2209:0 Progress(1) at <date>: 1 states generated, -1 distinct states found, -1 states left on queue.
---*)
