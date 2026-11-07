(*---
description: An evaluation error in Next from a later state prints the behavior up to it in simulation.
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
---- MODULE next_error_later ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = 1 \div (1 - x)
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
    The exception was a tlc2.tool.EvalException
    : @!@!@STARTMSG 2179:0 @!@!@
    The second argument of \div is 0.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a tlc2.tool.EvalException
    : @!@!@STARTMSG 2179:0 @!@!@
    The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 17, col 9 to line 17, col 13 of module next_error_later>
    x = 0
    2217:4 2: <Next line 18, col 9 to line 18, col 27 of module next_error_later>
    x = 1
    2209:0 Progress(1) at <date>: 2 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 2
    Simulation using seed 4 and aril 0
    2209:0 Progress(1) at <date>: 2 states generated, -1 distinct states found, -1 states left on queue.
---*)
