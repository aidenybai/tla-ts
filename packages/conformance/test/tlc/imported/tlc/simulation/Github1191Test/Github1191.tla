(*---
description: Ported from TLC's Github1191Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/simulation/Github1191Test.java
features:
  - tlc-regression
outcome: success
args:
  - -config
  - Github1191.tla
  - -simulate
  - num=1
  - -deadlock
---*)
---- MODULE Github1191 ----
EXTENDS Sequences

Parties == {"A", "B"}
Connections == Parties \X Parties \ {<<x, x>> : x \in Parties}

VARIABLES network, pc

vars == <<network, pc>>

ProcSet == Parties

Init ==
    /\ network = [c \in Connections |-> << >>]
    /\ pc = [self \in ProcSet |-> "Start"]

Start(self) ==
    /\ pc[self] = "Start"
    /\ \E dst \in {p \in Parties : p /= self} :
        network' = [network EXCEPT ![<<self, dst>>] = <<[type |-> "hello"]>>]
    /\ pc' = [pc EXCEPT ![self] = "Done"]

Terminating ==
    /\ \A self \in ProcSet : pc[self] = "Done"
    /\ UNCHANGED vars

Next ==
    \/ \E self \in Parties : Start(self)
    \/ Terminating

Spec == /\ Init /\ [][Next]_vars
        /\ \A self \in Parties : WF_vars(Start(self))

Termination == <>(\A self \in ProcSet : pc[self] = "Done")

=====
----- CONFIG Github1191 -----
SPECIFICATION Spec
PROPERTY Termination
========

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2209:0 Progress(1) at <date>: 101 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 101 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 101
    Simulation using seed 4 and aril 0
---*)
