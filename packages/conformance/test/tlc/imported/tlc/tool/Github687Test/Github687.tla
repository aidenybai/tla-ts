(*---
description: Ported from TLC's Github687Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github687Test.java
features:
  - tlc-regression
outcome: success
args:
  - -config
  - Github687.tla
  - -deadlock
---*)
---------------------------- MODULE Github687 ----------------------------
CONSTANTS Commands, Slots
VARIABLES log

Init == 
	log = [s \in Slots |-> {}]

Next ==
	\E s \in Slots:
		/\ log[s] = {}
	    /\ \E v \in Commands:
	    	log' = [log EXCEPT ![s] = {v}]

Spec == 
	Init /\ [][Next]_<<log>> /\ WF_log(Next)

ConsensusOnSlot(s) == 
	INSTANCE Consensus 
	WITH Values <- Commands, 
	     chosen_values <- log[s], 
	     SomeConstant <- {"a", "b"}

Correct ==
	\A s \in Slots: ConsensusOnSlot(s)!Spec

===========================================================================

---------------------------- MODULE Consensus ----------------------------
CONSTANT Values, SomeConstant
VARIABLE chosen_values

Init == chosen_values = {}
Next == chosen_values = {} /\ \E v \in Values: chosen_values' = {v}
Spec == 
	/\ Init /\ [][Next]_<<chosen_values>>
	\* The fairness constraint is here to trigger a code path in SpecProcessor.
	\* With regards to the spec, quantifying over SC is meaningless.
	/\ \A s \in SomeConstant: WF_<<chosen_values>>(Next)
===========================================================================

---------------------------- CONFIG Github687 ----------------------------
SPECIFICATION Spec
CONSTANT Commands = {Read, Write}
CONSTANT Slots = {Slot1, Slot2}
PROPERTY Correct
CHECK_DEADLOCK FALSE
===========================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 9 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 2.0E-18
    2199:0 13 states generated, 9 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 4 and the 95th percentile is 4).
---*)
