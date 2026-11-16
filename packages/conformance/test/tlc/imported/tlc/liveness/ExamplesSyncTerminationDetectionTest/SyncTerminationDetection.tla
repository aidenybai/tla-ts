(*---
description: Ported from TLC's ExamplesSyncTerminationDetectionTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/ExamplesSyncTerminationDetectionTest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |
  CONSTANTS
      N = 7

  SPECIFICATION 
      Spec

  INVARIANTS
      TypeOK
      TDCorrect

  PROPERTIES
      Quiescence
      Liveness
  PROPERTY
      DetectionLeadsToReactivation
args:
  - -lncheck
  - final
  - -deadlock
---*)
---------------------- MODULE SyncTerminationDetection ----------------------
(***************************************************************************)
(* This module contains an abstract specification of the termination       *)
(* detection problem in a ring with synchronous communication. We will     *)
(* prove that the EWD840 algorithm refines this specification.             *)
(***************************************************************************)
EXTENDS Naturals
CONSTANT N
ASSUME NAssumption == N \in Nat \ {0}

Node == 0 .. N-1

VARIABLES 
  active,               \* activation status of nodes
  terminationDetected   \* has termination been detected?

TypeOK ==
  /\ active \in [Node -> BOOLEAN]
  /\ terminationDetected \in BOOLEAN

terminated == \A n \in Node : ~ active[n]

(***************************************************************************)
(* Initial condition: the nodes can be active or inactive, termination     *)
(* may (but need not) be detected immediately if all nodes are inactive.   *)
(***************************************************************************)
Init ==
  /\ active \in [Node -> BOOLEAN]
  /\ terminationDetected \in {FALSE, terminated}

Terminate(i) ==  \* node i terminates
  /\ active[i]
  /\ active' = [active EXCEPT ![i] = FALSE]
     (* possibly (but not necessarily) detect termination if all nodes are inactive *)
  /\ terminationDetected' \in {terminationDetected, terminated'}

Wakeup(i,j) ==  \* node i activates node j
  /\ active[i]
  /\ active' = [active EXCEPT ![j] = TRUE]
  /\ UNCHANGED terminationDetected

DetectTermination ==
  /\ terminated
  /\ terminationDetected' = TRUE
  /\ UNCHANGED active

Next ==
  \/ \E i \in Node : Terminate(i)
  \/ \E i,j \in Node : Wakeup(i,j)
  \/ DetectTermination

vars == <<active, terminationDetected>>
Spec == Init /\ [][Next]_vars /\ WF_vars(DetectTermination)

------------------------------------------------------------------------------
(* Correctness properties *)

TDCorrect == terminationDetected => terminated

Quiescence == [](terminated => []terminated)

Liveness == terminated ~> terminationDetected

DetectionLeadsToReactivation == terminationDetected ~> (\E n \in Node : active[n])

=============================================================================
\* Modification History
\* Created Sun Jan 10 15:19:20 CET 2021 by merz

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 3 branches.
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2269:0 Computed 8 initial states...
    2269:0 Computed 16 initial states...
    2269:0 Computed 32 initial states...
    2269:0 Computed 64 initial states...
    2269:0 Computed 128 initial states...
    2190:0 Finished computing initial states: 129 distinct states generated at <date>.
    2192:0 Checking 3 branches of temporal properties for the complete state space with 387 total distinct states at (<date>)
    2116:1 Temporal property DetectionLeadsToReactivation was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    /\ active = ( 0 :> FALSE @@
      1 :> FALSE @@
      2 :> FALSE @@
      3 :> FALSE @@
      4 :> FALSE @@
      5 :> FALSE @@
      6 :> FALSE )
    /\ terminationDetected = TRUE
    2218:4 2: Stuttering
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 3722 states generated, 129 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
