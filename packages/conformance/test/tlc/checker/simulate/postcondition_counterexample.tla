(*---
description: A postcondition after a violation in simulation sees the behavior through CounterExample.
ref: tlc2/tool/Simulator.java#simulate
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  POSTCONDITION Post
args:
  - -simulate
  - num=1
  - -depth
  - "5"
---*)
---- MODULE postcondition_counterexample ----
EXTENDS Naturals, TLC, TLCExt
VARIABLE x
Init == x = 0
Next == x' = x + 1
Inv == x < 2
Post == PrintT(CounterExample)
====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Init line 19, col 9 to line 19, col 13 of module postcondition_counterexample>
    x = 0
    2217:4 2: <Next line 20, col 9 to line 20, col 18 of module postcondition_counterexample>
    x = 1
    2217:4 3: <Next line 20, col 9 to line 20, col 18 of module postcondition_counterexample>
    x = 2
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 3
    Simulation using seed 4 and aril 0
    | [ action |->
    |       { << <<1, [x |-> 0]>>,
    |            [ name |-> "Next",
    |              location |->
    |                  [ beginLine |-> 20,
    |                    beginColumn |-> 9,
    |                    endLine |-> 20,
    |                    endColumn |-> 18,
    |                    module |-> "postcondition_counterexample" ] ],
    |            <<2, [x |-> 1]>> >>,
    |         << <<2, [x |-> 1]>>,
    |            [ name |-> "Next",
    |              location |->
    |                  [ beginLine |-> 20,
    |                    beginColumn |-> 9,
    |                    endLine |-> 20,
    |                    endColumn |-> 18,
    |                    module |-> "postcondition_counterexample" ] ],
    |            <<3, [x |-> 2]>> >> },
    |   state |-> {<<1, [x |-> 0]>>, <<2, [x |-> 1]>>, <<3, [x |-> 2]>>} ]
    2209:0 Progress(1) at <date>: 3 states generated, -1 distinct states found, -1 states left on queue.
---*)
