(*---
description: A POSTCONDITION evaluates after an invariant violation in model checking, when it uses CounterExample.
ref: tlc2/tool/Worker.java#doPostCheckAssumption
outcome: safety-violation
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  POSTCONDITION Post
---*)
---- MODULE true_after_invariant ----
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
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 15, col 9 to line 15, col 18 of module true_after_invariant>
    x = 1
    2217:4 3: <Next line 15, col 9 to line 15, col 18 of module true_after_invariant>
    x = 2
    | [ action |->
    |       { << <<1, [x |-> 0]>>,
    |            [ name |-> "Next",
    |              location |->
    |                  [ beginLine |-> 15,
    |                    beginColumn |-> 9,
    |                    endLine |-> 15,
    |                    endColumn |-> 18,
    |                    module |-> "true_after_invariant" ] ],
    |            <<2, [x |-> 1]>> >>,
    |         << <<2, [x |-> 1]>>,
    |            [ name |-> "Next",
    |              location |->
    |                  [ beginLine |-> 15,
    |                    beginColumn |-> 9,
    |                    endLine |-> 15,
    |                    endColumn |-> 18,
    |                    module |-> "true_after_invariant" ] ],
    |            <<3, [x |-> 2]>> >> },
    |   state |-> {<<1, [x |-> 0]>>, <<2, [x |-> 1]>>, <<3, [x |-> 2]>>} ]
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
