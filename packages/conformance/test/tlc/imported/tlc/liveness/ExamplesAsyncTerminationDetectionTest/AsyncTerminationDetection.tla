(*---
description: Ported from TLC's ExamplesAsyncTerminationDetectionTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/ExamplesAsyncTerminationDetectionTest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |-
  SPECIFICATION 
    Spec
  CONSTANT
    N = 4
  INVARIANTS
    TypeOK
    Safe
  PROPERTIES 
    Quiescence
    Live
    PendingInfOften
  CONSTRAINT
    StateConstraint
  POSTCONDITION
    PostCondition
args:
  - -lncheck
  - final
  - -deadlock
---*)
---------------------- MODULE AsyncTerminationDetection ---------------------
(***************************************************************************)
(* An abstract specification of the termination detection problem in a     *)
(* ring with asynchronous communication.                                   *)
(***************************************************************************)
EXTENDS Naturals, TLC, TLCExt
CONSTANT
  \* @type: Int; 
  N
ASSUME NAssumption == N \in Nat \ {0}

Node == 0 .. N-1

VARIABLES 
  \* @type: Int -> Bool;
  active,               \* activation status of nodes
  \* @type: Int -> Int;
  pending,              \* number of messages pending at a node
  \* @type: Bool;
  terminationDetected   \* has termination been detected?

TypeOK ==
  /\ active \in [Node -> BOOLEAN]
  /\ pending \in [Node -> Nat]
  /\ terminationDetected \in BOOLEAN

terminated == \A n \in Node : ~ active[n] /\ pending[n] = 0

(***************************************************************************)
(* Initial condition: the nodes can be active or inactive, no pending      *)
(* messages. Termination may (but need not) be detected immediately if all *)
(* nodes are inactive.                                                     *)
(***************************************************************************)
Init ==
  /\ active \in [Node -> BOOLEAN]
  /\ pending = [n \in Node |-> 0]
  /\ terminationDetected \in {FALSE, terminated}

Terminate(i) ==  \* node i terminates
  /\ active[i]
  /\ active' = [active EXCEPT ![i] = FALSE]
  /\ pending' = pending
     (* possibly (but not necessarily) detect termination if all nodes are inactive *)
  /\ terminationDetected' \in {terminationDetected, terminated'}

SendMsg(i,j) ==  \* node i sends a message to node j
  /\ active[i]
  /\ pending' = [pending EXCEPT ![j] = @ + 1]
  /\ UNCHANGED <<active, terminationDetected>>

RcvMsg(i) == \* node i receives a pending message
  /\ pending[i] > 0
  /\ active' = [active EXCEPT ![i] = TRUE]
  /\ pending' = [pending EXCEPT ![i] = @ - 1]
  /\ UNCHANGED terminationDetected

DetectTermination ==
  /\ terminated
  /\ terminationDetected' = TRUE
  /\ UNCHANGED <<active, pending>>

Next ==
  \/ \E i \in Node : RcvMsg(i) \/ Terminate(i)
  \/ \E i,j \in Node : SendMsg(i,j)
  \/ DetectTermination

vars == <<active, pending, terminationDetected>>
Spec == /\ Init /\ [][Next]_vars
        /\ WF_vars(DetectTermination)
           \* reasonable but not necessary for detecting termination
           \* /\ \A i \in Node : WF_vars(Wakeup(i))

\* a temporary solution for Apalache, until it translates [][Next]_vars
NextOrUnchanged ==
    Next \/ UNCHANGED vars

(***************************************************************************)
(* Restrict TLC model checking to a finite fragment of the state space.    *)
(***************************************************************************)
StateConstraint == \A n \in Node : pending[n] <= 3

(***************************************************************************)
(* Correctness properties.                                                 *)
(***************************************************************************)
Safe == terminationDetected => terminated

Quiescence == [](terminated => []terminated)

Live == terminated ~> terminationDetected

(***************************************************************************)
(* An inductive invariant to be checked with Apalache.                     *)
(***************************************************************************)
IndInv ==
    /\ TypeOK
    /\ Safe

\* By proving QuiescenceAsActionInv, we show that Quiescence holds true
QuiescenceAsActionInv ==
    terminated => terminated'

\* @typeAlias: STATE =
\*   [ active: Int -> Bool, pending: Int -> Int, terminationDetected: Bool ];
\* @type: Seq(STATE) => Bool;
QuiescenceAsTraceInv(hist) ==
    LET terminatedAt(i) ==
        \A n \in Node: ~hist[i].active[n] /\ hist[i].pending[n] = 0
    IN
    \A i \in DOMAIN hist:
        terminatedAt(i) =>
            \A j \in DOMAIN hist: j >= i => terminatedAt(j)

(***************************************************************************)
(* Use Apalache to verify Quiescence by checking the action formula        *)
(* StableActionInvariant for a model with initial-state predicate TypeOK   *)
(* and next-state relation Next.                                           *)
(***************************************************************************)
StableActionInvariant == terminated => terminated'

PendingInfOften == <>[][DetectTermination]_vars

PostCondition ==
  CounterExample =
   [ action |->
      { << << 1,
              [ active |->
                    (0 :> FALSE @@ 1 :> FALSE @@ 2 :> FALSE @@ 3 :> TRUE),
                pending |-> (0 :> 0 @@ 1 :> 0 @@ 2 :> 0 @@ 3 :> 0),
                terminationDetected |-> FALSE ] >>,
           [ name |-> "SendMsg",
             location |->
                 [ beginLine |-> 47,
                   beginColumn |-> 3,
                   endLine |-> 49,
                   endColumn |-> 46,
                   module |-> "AsyncTerminationDetection" ],
             context |-> [i |-> 3, j |-> 3],
             parameters |-> <<"i", "j">> ],
           << 2,
              [ active |->
                    (0 :> FALSE @@ 1 :> FALSE @@ 2 :> FALSE @@ 3 :> TRUE),
                pending |-> (0 :> 0 @@ 1 :> 0 @@ 2 :> 0 @@ 3 :> 1),
                terminationDetected |-> FALSE ] >> >>,
        << << 2,
              [ active |->
                    (0 :> FALSE @@ 1 :> FALSE @@ 2 :> FALSE @@ 3 :> TRUE),
                pending |-> (0 :> 0 @@ 1 :> 0 @@ 2 :> 0 @@ 3 :> 1),
                terminationDetected |-> FALSE ] >>,
           [ name |-> "RcvMsg",
             location |->
                 [ beginLine |-> 52,
                   beginColumn |-> 3,
                   endLine |-> 55,
                   endColumn |-> 34,
                   module |-> "AsyncTerminationDetection" ],
             context |-> [i |-> 3],
             parameters |-> <<"i">> ],
           << 1,
              [ active |->
                    (0 :> FALSE @@ 1 :> FALSE @@ 2 :> FALSE @@ 3 :> TRUE),
                pending |-> (0 :> 0 @@ 1 :> 0 @@ 2 :> 0 @@ 3 :> 0),
                terminationDetected |-> FALSE ] >> >> },
  state |->
      { << 1,
           [ active |-> (0 :> FALSE @@ 1 :> FALSE @@ 2 :> FALSE @@ 3 :> TRUE),
             pending |-> (0 :> 0 @@ 1 :> 0 @@ 2 :> 0 @@ 3 :> 0),
             terminationDetected |-> FALSE ] >>,
        << 2,
           [ active |-> (0 :> FALSE @@ 1 :> FALSE @@ 2 :> FALSE @@ 3 :> TRUE),
             pending |-> (0 :> 0 @@ 1 :> 0 @@ 2 :> 0 @@ 3 :> 1),
             terminationDetected |-> FALSE ] >> } ]

=============================================================================
\* Modification History
\* Last modified Tue Apr 12 15:04:08 CEST 2022 by merz
\* Last modified Wed Jun 02 14:21:31 PDT 2021 by markus
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
    2190:0 Finished computing initial states: 17 distinct states generated at <date>.
    2192:0 Checking 3 branches of temporal properties for the complete state space with 12291 total distinct states at (<date>)
    2116:1 Temporal property PendingInfOften was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    /\ pending = (0 :> 0 @@ 1 :> 0 @@ 2 :> 0 @@ 3 :> 0)
    /\ active = (0 :> FALSE @@ 1 :> FALSE @@ 2 :> FALSE @@ 3 :> TRUE)
    /\ terminationDetected = FALSE
    2217:4 2: <SendMsg(3,3) line 74, col 3 to line 76, col 46 of module AsyncTerminationDetection>
    /\ pending = (0 :> 0 @@ 1 :> 0 @@ 2 :> 0 @@ 3 :> 1)
    /\ active = (0 :> FALSE @@ 1 :> FALSE @@ 2 :> FALSE @@ 3 :> TRUE)
    /\ terminationDetected = FALSE
    2122:4 1: Back to state: <RcvMsg(3) line 79, col 3 to line 82, col 34 of module AsyncTerminationDetection>
    2404:1 Postcondition PostCondition at line 150, col 3 to line 198, col 51 of module AsyncTerminationDetection is false.
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 53271 states generated, 4097 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 14.
---*)
