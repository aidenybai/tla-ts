(*---
description: After a liveness violation, CounterExample's actions close the lasso.
ref: tlc2/module/TLCExt.java#error
features:
  - TLCExt
outcome: liveness-violation
config: |
  SPECIFICATION Spec
  PROPERTY Prop
  POSTCONDITION Post
---*)
---- MODULE counterexample_liveness_loop ----
EXTENDS TLCExt, TLC, Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 2
Spec == Init /\ [][Next]_x /\ WF_x(Next)
Prop == <>[](x = 1)
Post == PrintT(CounterExample)
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 2 total distinct states at (<date>)
    2116:1 Temporal property Prop was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 16, col 9 to line 16, col 24 of module counterexample_liveness_loop>
    x = 1
    2122:4 1: Back to state: <Next line 16, col 9 to line 16, col 24 of module counterexample_liveness_loop>
    | [ action |->
    |       { << <<1, [x |-> 0]>>,
    |            [ name |-> "Next",
    |              location |->
    |                  [ beginLine |-> 16,
    |                    beginColumn |-> 9,
    |                    endLine |-> 16,
    |                    endColumn |-> 24,
    |                    module |-> "counterexample_liveness_loop" ] ],
    |            <<2, [x |-> 1]>> >>,
    |         << <<2, [x |-> 1]>>,
    |            [ name |-> "Next",
    |              location |->
    |                  [ beginLine |-> 16,
    |                    beginColumn |-> 9,
    |                    endLine |-> 16,
    |                    endColumn |-> 24,
    |                    module |-> "counterexample_liveness_loop" ] ],
    |            <<1, [x |-> 0]>> >> },
    |   state |-> {<<1, [x |-> 0]>>, <<2, [x |-> 1]>>} ]
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
