(*---
description: Simulation collects initial states in a StateVec, so more than -maxSetSize fails. The message arrives wrapped in a general error, because Assert.fail throws a RuntimeException here.
ref: tlc2/tool/StateVec.java#grow
outcome: tlc-error
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1
  - -maxSetSize
  - "2"
---*)
---- MODULE simulation_initial_states ----
EXTENDS Naturals
VARIABLE x
Init == x \in 1..9
Next == x' = x
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2172:0 Too many possible next states for the last state in the trace.
    2209:0 Progress(0) at <date>: 0 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 0
    Simulation using seed 4 and aril 0
---*)
