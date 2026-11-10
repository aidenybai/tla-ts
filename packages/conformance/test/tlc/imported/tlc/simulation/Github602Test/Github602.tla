(*---
description: Ported from TLC's Github602Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/simulation/Github602Test.java
features:
  - tlc-regression
outcome: success
args:
  - -config
  - Github602.tla
  - -simulate
  - num=1
  - -deadlock
---*)
------ MODULE Github602 ------
EXTENDS Integers, TLC, TLCExt

VARIABLE x

Init == x = 0

A == /\ x \in Nat
     /\ x' = -x

B == x' = x + 1

Next == A \/ B

Constraint ==  x \in Nat

Inv == x >= 0

ActionConstraint == x' \in Nat

PostCondition ==
	/\ TLCSet(42, TLCGet("generated"))
	/\ ToTrace(CounterExample) = << [x |-> 0],[x |-> 1],[x |-> -1] >> 

Init2 == x = 1

PostCondition2 ==
	/\ TLCSet(42, TLCGet("generated"))
	/\ ToTrace(CounterExample) = << [x |-> 1],[x |-> -1] >> 
====

---- CONFIG Github602 ----
INIT Init
NEXT Next
CONSTRAINT Constraint
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 1 initial states...
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2209:0 Progress(1) at <date>: 151 states generated, -1 distinct states found, -1 states left on queue.
    2209:0 Progress(1) at <date>: 151 states generated, -1 distinct states found, -1 states left on queue.
    2210:0 The number of states generated: 151
    Simulation using seed 4 and aril 0
---*)
