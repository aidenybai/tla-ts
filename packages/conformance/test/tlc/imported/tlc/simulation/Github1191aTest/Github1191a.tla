(*---
description: Ported from TLC's Github1191aTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/simulation/Github1191aTest.java
features:
  - tlc-regression
outcome: liveness-violation
args:
  - -config
  - Github1191a.tla
  - -simulate
  - num=1
  - -deadlock
---*)
---- MODULE Github1191a ----

P == { "A", "B" }
C == P \X P

VARIABLES var

Init == 
    var = [c \in C |-> << >>]

Next ==
    \E src, dst \in P:
        var' = [var EXCEPT ![<<src, dst>>] = << [ type |-> "hello" ] >>]

Spec == Init /\ [][Next]_var

Termination == <>FALSE

====
---- CONFIG Github1191a ----
SPECIFICATION Spec
PROPERTY Termination
====

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2116:1 Temporal property Termination was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Init line 22, col 5 to line 22, col 29 of module Github1191a>
    var = ( <<"A", "A">> :> <<>> @@
      <<"A", "B">> :> <<>> @@
      <<"B", "A">> :> <<>> @@
      <<"B", "B">> :> <<>> )
    2217:4 2: <Next line 26, col 9 to line 26, col 72 of module Github1191a>
    var = ( <<"A", "A">> :> <<[type |-> "hello"]>> @@
      <<"A", "B">> :> <<>> @@
      <<"B", "A">> :> <<>> @@
      <<"B", "B">> :> <<>> )
    2217:4 3: <Next line 26, col 9 to line 26, col 72 of module Github1191a>
    var = ( <<"A", "A">> :> <<[type |-> "hello"]>> @@
      <<"A", "B">> :> <<>> @@
      <<"B", "A">> :> <<[type |-> "hello"]>> @@
      <<"B", "B">> :> <<>> )
    2217:4 4: <Next line 26, col 9 to line 26, col 72 of module Github1191a>
    var = ( <<"A", "A">> :> <<[type |-> "hello"]>> @@
      <<"A", "B">> :> <<>> @@
      <<"B", "A">> :> <<[type |-> "hello"]>> @@
      <<"B", "B">> :> <<[type |-> "hello"]>> )
    2217:4 5: <Next line 26, col 9 to line 26, col 72 of module Github1191a>
    var = ( <<"A", "A">> :> <<[type |-> "hello"]>> @@
      <<"A", "B">> :> <<[type |-> "hello"]>> @@
      <<"B", "A">> :> <<[type |-> "hello"]>> @@
      <<"B", "B">> :> <<[type |-> "hello"]>> )
    2218:4 6: Stuttering
    2209:0 Progress(1) at <date>: 101 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 101
    Simulation using seed 4 and aril 0
    2209:0 Progress(1) at <date>: 101 states generated, -1 distinct states found, -1 states left on queue.
---*)
