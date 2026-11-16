(*---
description: Ported from TLC's CodePlexBug08AgentRing790Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/CodePlexBug08AgentRing790Test.java
features:
  - tlc-regression
outcome: success
config: |
  CONSTANT
  N = 2
  CONSTRAINT
  Limits
  SPECIFICATION
  Prog
  INVARIANT
  TypeInv
  PROPERTY
  TestBogus
args:
  - -deadlock
includes:
  - AgentRing.tla
  - EWD840MC2_TTrace_2000000000_Expected.json
---*)
---- MODULE AgentRingMC ----
EXTENDS AgentRing, TLC, TLCExt

\* CONSTANT definitions @modelParameterConstants:0N
const_142745588766737000 == 
2
----

\* CONSTRAINT definition @modelParameterContraint:0
constr_142745588768338000 ==
Limits
----
\* SPECIFICATION definition @modelBehaviorSpec:0
spec_142745588769939000 ==
Prog
----
\* INVARIANT definition @modelCorrectnessInvariants:0
inv_142745588771440000 ==
TypeInv
----
\* PROPERTY definition @modelCorrectnessProperties:0
prop_142745588773041000 ==
Test
----
PostCondition ==
	/\ TLCSet(42, TLCGet("generated"))
	/\ CounterExample =
			[ action |->
			      { << << 1,
			              [ Nodes |-> (0 :> [Load |-> 0] @@ 1 :> [Load |-> 0]),
			                Agent |->
			                    [ Loc |-> 0,
			                      LastLoad |-> 0,
			                      ReadyToMove |-> TRUE,
			                      Task |-> 0 ],
			                CanCreate |-> TRUE ] >>,
			           [ name |-> "CreateTasks",
			             location |->
			                 [ beginLine |-> 82,
			                   beginColumn |-> 3,
			                   endLine |-> 84,
			                   endColumn |-> 35,
			                   module |-> "AgentRing" ] ],
			           << 2,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 0]),
			                Agent |->
			                    [ Loc |-> 0,
			                      LastLoad |-> 0,
			                      ReadyToMove |-> TRUE,
			                      Task |-> 0 ],
			                CanCreate |-> TRUE ] >> >>,
			        << << 2,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 0]),
			                Agent |->
			                    [ Loc |-> 0,
			                      LastLoad |-> 0,
			                      ReadyToMove |-> TRUE,
			                      Task |-> 0 ],
			                CanCreate |-> TRUE ] >>,
			           [ name |-> "Move",
			             location |->
			                 [ beginLine |-> 58,
			                   beginColumn |-> 3,
			                   endLine |-> 60,
			                   endColumn |-> 35,
			                   module |-> "AgentRing" ] ],
			           << 3,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 0]),
			                Agent |->
			                    [ Loc |-> 1,
			                      LastLoad |-> 0,
			                      ReadyToMove |-> FALSE,
			                      Task |-> 0 ],
			                CanCreate |-> TRUE ] >> >>,
			        << << 3,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 0]),
			                Agent |->
			                    [ Loc |-> 1,
			                      LastLoad |-> 0,
			                      ReadyToMove |-> FALSE,
			                      Task |-> 0 ],
			                CanCreate |-> TRUE ] >>,
			           [ name |-> "CreateTasks",
			             location |->
			                 [ beginLine |-> 82,
			                   beginColumn |-> 3,
			                   endLine |-> 84,
			                   endColumn |-> 35,
			                   module |-> "AgentRing" ] ],
			           << 4,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			                Agent |->
			                    [ Loc |-> 1,
			                      LastLoad |-> 0,
			                      ReadyToMove |-> FALSE,
			                      Task |-> 0 ],
			                CanCreate |-> TRUE ] >> >>,
			        << << 4,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			                Agent |->
			                    [ Loc |-> 1,
			                      LastLoad |-> 0,
			                      ReadyToMove |-> FALSE,
			                      Task |-> 0 ],
			                CanCreate |-> TRUE ] >>,
			           [ name |-> "Stop",
			             location |->
			                 [ beginLine |-> 78,
			                   beginColumn |-> 3,
			                   endLine |-> 79,
			                   endColumn |-> 31,
			                   module |-> "AgentRing" ] ],
			           << 5,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			                Agent |->
			                    [ Loc |-> 1,
			                      LastLoad |-> 0,
			                      ReadyToMove |-> FALSE,
			                      Task |-> 0 ],
			                CanCreate |-> FALSE ] >> >>,
			        << << 5,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			                Agent |->
			                    [ Loc |-> 1,
			                      LastLoad |-> 0,
			                      ReadyToMove |-> FALSE,
			                      Task |-> 0 ],
			                CanCreate |-> FALSE ] >>,
			           [ name |-> "LookAndAct",
			             location |->
			                 [ beginLine |-> 63,
			                   beginColumn |-> 3,
			                   endLine |-> 75,
			                   endColumn |-> 24,
			                   module |-> "AgentRing" ] ],
			           << 6,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 1]),
			                Agent |->
			                    [ Loc |-> 1,
			                      LastLoad |-> 1,
			                      ReadyToMove |-> TRUE,
			                      Task |-> 1 ],
			                CanCreate |-> FALSE ] >> >>,
			        << << 6,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 1]),
			                Agent |->
			                    [ Loc |-> 1,
			                      LastLoad |-> 1,
			                      ReadyToMove |-> TRUE,
			                      Task |-> 1 ],
			                CanCreate |-> FALSE ] >>,
			           [ name |-> "Move",
			             location |->
			                 [ beginLine |-> 58,
			                   beginColumn |-> 3,
			                   endLine |-> 60,
			                   endColumn |-> 35,
			                   module |-> "AgentRing" ] ],
			           << 7,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 1]),
			                Agent |->
			                    [ Loc |-> 0,
			                      LastLoad |-> 1,
			                      ReadyToMove |-> FALSE,
			                      Task |-> 1 ],
			                CanCreate |-> FALSE ] >> >>,
			        << << 7,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 1]),
			                Agent |->
			                    [ Loc |-> 0,
			                      LastLoad |-> 1,
			                      ReadyToMove |-> FALSE,
			                      Task |-> 1 ],
			                CanCreate |-> FALSE ] >>,
			           [ name |-> "LookAndAct",
			             location |->
			                 [ beginLine |-> 63,
			                   beginColumn |-> 3,
			                   endLine |-> 75,
			                   endColumn |-> 24,
			                   module |-> "AgentRing" ] ],
			           << 8,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 1]),
			                Agent |->
			                    [ Loc |-> 0,
			                      LastLoad |-> 2,
			                      ReadyToMove |-> TRUE,
			                      Task |-> 1 ],
			                CanCreate |-> FALSE ] >> >>,
			        << << 8,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 1]),
			                Agent |->
			                    [ Loc |-> 0,
			                      LastLoad |-> 2,
			                      ReadyToMove |-> TRUE,
			                      Task |-> 1 ],
			                CanCreate |-> FALSE ] >>,
			           [ name |-> "Move",
			             location |->
			                 [ beginLine |-> 58,
			                   beginColumn |-> 3,
			                   endLine |-> 60,
			                   endColumn |-> 35,
			                   module |-> "AgentRing" ] ],
			           << 9,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 1]),
			                Agent |->
			                    [ Loc |-> 1,
			                      LastLoad |-> 2,
			                      ReadyToMove |-> FALSE,
			                      Task |-> 1 ],
			                CanCreate |-> FALSE ] >> >>,
			        << << 9,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 1]),
			                Agent |->
			                    [ Loc |-> 1,
			                      LastLoad |-> 2,
			                      ReadyToMove |-> FALSE,
			                      Task |-> 1 ],
			                CanCreate |-> FALSE ] >>,
			           [ name |-> "LookAndAct",
			             location |->
			                 [ beginLine |-> 63,
			                   beginColumn |-> 3,
			                   endLine |-> 75,
			                   endColumn |-> 24,
			                   module |-> "AgentRing" ] ],
			           << 10,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			                Agent |->
			                    [ Loc |-> 1,
			                      LastLoad |-> 2,
			                      ReadyToMove |-> TRUE,
			                      Task |-> 0 ],
			                CanCreate |-> FALSE ] >> >>,
			        << << 10,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			                Agent |->
			                    [ Loc |-> 1,
			                      LastLoad |-> 2,
			                      ReadyToMove |-> TRUE,
			                      Task |-> 0 ],
			                CanCreate |-> FALSE ] >>,
			           [ name |-> "Move",
			             location |->
			                 [ beginLine |-> 58,
			                   beginColumn |-> 3,
			                   endLine |-> 60,
			                   endColumn |-> 35,
			                   module |-> "AgentRing" ] ],
			           << 11,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			                Agent |->
			                    [ Loc |-> 0,
			                      LastLoad |-> 2,
			                      ReadyToMove |-> FALSE,
			                      Task |-> 0 ],
			                CanCreate |-> FALSE ] >> >>,
			        << << 11,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			                Agent |->
			                    [ Loc |-> 0,
			                      LastLoad |-> 2,
			                      ReadyToMove |-> FALSE,
			                      Task |-> 0 ],
			                CanCreate |-> FALSE ] >>,
			           [ name |-> "LookAndAct",
			             location |->
			                 [ beginLine |-> 63,
			                   beginColumn |-> 3,
			                   endLine |-> 75,
			                   endColumn |-> 24,
			                   module |-> "AgentRing" ] ],
			           << 12,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			                Agent |->
			                    [ Loc |-> 0,
			                      LastLoad |-> 2,
			                      ReadyToMove |-> TRUE,
			                      Task |-> 0 ],
			                CanCreate |-> FALSE ] >> >>,
			        << << 12,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			                Agent |->
			                    [ Loc |-> 0,
			                      LastLoad |-> 2,
			                      ReadyToMove |-> TRUE,
			                      Task |-> 0 ],
			                CanCreate |-> FALSE ] >>,
			           [ name |-> "Move",
			             location |->
			                 [ beginLine |-> 58,
			                   beginColumn |-> 3,
			                   endLine |-> 60,
			                   endColumn |-> 35,
			                   module |-> "AgentRing" ] ],
			           << 13,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			                Agent |->
			                    [ Loc |-> 1,
			                      LastLoad |-> 2,
			                      ReadyToMove |-> FALSE,
			                      Task |-> 0 ],
			                CanCreate |-> FALSE ] >> >>,
			        << << 13,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			                Agent |->
			                    [ Loc |-> 1,
			                      LastLoad |-> 2,
			                      ReadyToMove |-> FALSE,
			                      Task |-> 0 ],
			                CanCreate |-> FALSE ] >>,
			           [ name |-> "LookAndAct",
			             location |->
			                 [ beginLine |-> 63,
			                   beginColumn |-> 3,
			                   endLine |-> 75,
			                   endColumn |-> 24,
			                   module |-> "AgentRing" ] ],
			           << 10,
			              [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			                Agent |->
			                    [ Loc |-> 1,
			                      LastLoad |-> 2,
			                      ReadyToMove |-> TRUE,
			                      Task |-> 0 ],
			                CanCreate |-> FALSE ] >> >> },
			  state |->
			      { << 1,
			           [ Nodes |-> (0 :> [Load |-> 0] @@ 1 :> [Load |-> 0]),
			             Agent |->
			                 [Loc |-> 0, LastLoad |-> 0, ReadyToMove |-> TRUE, Task |-> 0],
			             CanCreate |-> TRUE ] >>,
			        << 2,
			           [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 0]),
			             Agent |->
			                 [Loc |-> 0, LastLoad |-> 0, ReadyToMove |-> TRUE, Task |-> 0],
			             CanCreate |-> TRUE ] >>,
			        << 3,
			           [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 0]),
			             Agent |->
			                 [Loc |-> 1, LastLoad |-> 0, ReadyToMove |-> FALSE, Task |-> 0],
			             CanCreate |-> TRUE ] >>,
			        << 4,
			           [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			             Agent |->
			                 [Loc |-> 1, LastLoad |-> 0, ReadyToMove |-> FALSE, Task |-> 0],
			             CanCreate |-> TRUE ] >>,
			        << 5,
			           [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			             Agent |->
			                 [Loc |-> 1, LastLoad |-> 0, ReadyToMove |-> FALSE, Task |-> 0],
			             CanCreate |-> FALSE ] >>,
			        << 6,
			           [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 1]),
			             Agent |->
			                 [Loc |-> 1, LastLoad |-> 1, ReadyToMove |-> TRUE, Task |-> 1],
			             CanCreate |-> FALSE ] >>,
			        << 7,
			           [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 1]),
			             Agent |->
			                 [Loc |-> 0, LastLoad |-> 1, ReadyToMove |-> FALSE, Task |-> 1],
			             CanCreate |-> FALSE ] >>,
			        << 8,
			           [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 1]),
			             Agent |->
			                 [Loc |-> 0, LastLoad |-> 2, ReadyToMove |-> TRUE, Task |-> 1],
			             CanCreate |-> FALSE ] >>,
			        << 9,
			           [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 1]),
			             Agent |->
			                 [Loc |-> 1, LastLoad |-> 2, ReadyToMove |-> FALSE, Task |-> 1],
			             CanCreate |-> FALSE ] >>,
			        << 10,
			           [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			             Agent |->
			                 [Loc |-> 1, LastLoad |-> 2, ReadyToMove |-> TRUE, Task |-> 0],
			             CanCreate |-> FALSE ] >>,
			        << 11,
			           [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			             Agent |->
			                 [Loc |-> 0, LastLoad |-> 2, ReadyToMove |-> FALSE, Task |-> 0],
			             CanCreate |-> FALSE ] >>,
			        << 12,
			           [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			             Agent |->
			                 [Loc |-> 0, LastLoad |-> 2, ReadyToMove |-> TRUE, Task |-> 0],
			             CanCreate |-> FALSE ] >>,
			        << 13,
			           [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			             Agent |->
			                 [Loc |-> 1, LastLoad |-> 2, ReadyToMove |-> FALSE, Task |-> 0],
			             CanCreate |-> FALSE ] >> } ]
	/\ ToTrace(CounterExample) =
			<< [ Nodes |-> (0 :> [Load |-> 0] @@ 1 :> [Load |-> 0]),
			     Agent |-> [Loc |-> 0, LastLoad |-> 0, ReadyToMove |-> TRUE, Task |-> 0],
			     CanCreate |-> TRUE ],
			   [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 0]),
			     Agent |-> [Loc |-> 0, LastLoad |-> 0, ReadyToMove |-> TRUE, Task |-> 0],
			     CanCreate |-> TRUE ],
			   [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 0]),
			     Agent |-> [Loc |-> 1, LastLoad |-> 0, ReadyToMove |-> FALSE, Task |-> 0],
			     CanCreate |-> TRUE ],
			   [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			     Agent |-> [Loc |-> 1, LastLoad |-> 0, ReadyToMove |-> FALSE, Task |-> 0],
			     CanCreate |-> TRUE ],
			   [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			     Agent |-> [Loc |-> 1, LastLoad |-> 0, ReadyToMove |-> FALSE, Task |-> 0],
			     CanCreate |-> FALSE ],
			   [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 1]),
			     Agent |-> [Loc |-> 1, LastLoad |-> 1, ReadyToMove |-> TRUE, Task |-> 1],
			     CanCreate |-> FALSE ],
			   [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 1]),
			     Agent |-> [Loc |-> 0, LastLoad |-> 1, ReadyToMove |-> FALSE, Task |-> 1],
			     CanCreate |-> FALSE ],
			   [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 1]),
			     Agent |-> [Loc |-> 0, LastLoad |-> 2, ReadyToMove |-> TRUE, Task |-> 1],
			     CanCreate |-> FALSE ],
			   [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 1]),
			     Agent |-> [Loc |-> 1, LastLoad |-> 2, ReadyToMove |-> FALSE, Task |-> 1],
			     CanCreate |-> FALSE ],
			   [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			     Agent |-> [Loc |-> 1, LastLoad |-> 2, ReadyToMove |-> TRUE, Task |-> 0],
			     CanCreate |-> FALSE ],
			   [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			     Agent |-> [Loc |-> 0, LastLoad |-> 2, ReadyToMove |-> FALSE, Task |-> 0],
			     CanCreate |-> FALSE ],
			   [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			     Agent |-> [Loc |-> 0, LastLoad |-> 2, ReadyToMove |-> TRUE, Task |-> 0],
			     CanCreate |-> FALSE ],
			   [ Nodes |-> (0 :> [Load |-> 2] @@ 1 :> [Load |-> 2]),
			     Agent |-> [Loc |-> 1, LastLoad |-> 2, ReadyToMove |-> FALSE, Task |-> 0],
			     CanCreate |-> FALSE ] >>

=============================================================================
\* Modification History
\* Created Fri Mar 27 12:31:27 CET 2015 by makuppe

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 120 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.6E-15
    2199:0 361 states generated, 120 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 13.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 4 and the 95th percentile is 4).
---*)
