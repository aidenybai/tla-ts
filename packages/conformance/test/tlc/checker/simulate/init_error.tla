(*---
description: An evaluation error in Init prints the general error and summary in simulation.
ref: tlc2/tool/Simulator.java#simulate
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
args:
  - -simulate
  - num=1
  - -depth
  - "5"
---*)
---- MODULE init_error ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 1 \div 0
Next == x' = x
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a tlc2.tool.EvalException
    :
    2179:0 The second argument of \div is 0.
    2209:0 Progress(0) at <date>: 0 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 0
    Simulation using seed 4 and aril 0
---*)
