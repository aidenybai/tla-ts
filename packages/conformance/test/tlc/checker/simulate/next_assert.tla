(*---
description: A failed Assert in Next under -simulate is wrapped as an unexpected exception and exits 255, not with the assertion status.
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
---- MODULE next_assert ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == Assert(x < 2, "too big") /\ x' = x + 1
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
    :
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    "too big"
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 17, col 9 to line 17, col 13 of module next_assert>
    x = 0
    2217:4 2: <Next line 18, col 9 to line 18, col 46 of module next_assert>
    x = 1
    2217:4 3: <Next line 18, col 9 to line 18, col 46 of module next_assert>
    x = 2
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 3
    Simulation using seed 4 and aril 0
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
---*)
