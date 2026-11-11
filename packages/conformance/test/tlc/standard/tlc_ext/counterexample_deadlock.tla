(*---
description: After a deadlock, CounterExample holds the trace to the deadlocked state.
ref: tlc2/module/TLCExt.java#error
features:
  - TLCExt
outcome: deadlock
config: |
  INIT Init
  NEXT Next
  POSTCONDITION Post
---*)
---- MODULE counterexample_deadlock ----
EXTENDS TLCExt, TLC, Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1
Post == PrintT(CounterExample)
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 16, col 9 to line 16, col 27 of module counterexample_deadlock>
    x = 1
    2217:4 3: <Next line 16, col 9 to line 16, col 27 of module counterexample_deadlock>
    x = 2
    | [ action |->
    |       { << <<1, [x |-> 0]>>,
    |            [ name |-> "Next",
    |              location |->
    |                  [ beginLine |-> 16,
    |                    beginColumn |-> 9,
    |                    endLine |-> 16,
    |                    endColumn |-> 27,
    |                    module |-> "counterexample_deadlock" ] ],
    |            <<2, [x |-> 1]>> >>,
    |         << <<2, [x |-> 1]>>,
    |            [ name |-> "Next",
    |              location |->
    |                  [ beginLine |-> 16,
    |                    beginColumn |-> 9,
    |                    endLine |-> 16,
    |                    endColumn |-> 27,
    |                    module |-> "counterexample_deadlock" ] ],
    |            <<3, [x |-> 2]>> >> },
    |   state |-> {<<1, [x |-> 0]>>, <<2, [x |-> 1]>>, <<3, [x |-> 2]>>} ]
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
