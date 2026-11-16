(*---
description: CounterExample after a deadlock holds the behavior.
ref: tlc2/tool/Worker.java#doPostCheckAssumption
outcome: deadlock
config: |
  INIT Init
  NEXT Next
  POSTCONDITION Post
---*)
---- MODULE counterexample_deadlock ----
EXTENDS Naturals, TLC, TLCExt
VARIABLE x
Init == x = 0
Next == x < 1 /\ x' = x + 1
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
    2217:4 2: <Next line 14, col 9 to line 14, col 27 of module counterexample_deadlock>
    x = 1
    | [ action |->
    |       { << <<1, [x |-> 0]>>,
    |            [ name |-> "Next",
    |              location |->
    |                  [ beginLine |-> 14,
    |                    beginColumn |-> 9,
    |                    endLine |-> 14,
    |                    endColumn |-> 27,
    |                    module |-> "counterexample_deadlock" ] ],
    |            <<2, [x |-> 1]>> >> },
    |   state |-> {<<1, [x |-> 0]>>, <<2, [x |-> 1]>>} ]
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
