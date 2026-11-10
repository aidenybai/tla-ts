(*---
description: Ported from TLC's ExamplesMCLiveInternalMemoryTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/ExamplesMCLiveInternalMemoryTest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |-
  SPECIFICATION LISpec
    \* Tells TLC that LISpec is the specification to check.

  PROPERTY LivenessProperty
    \* Tells TLC to check that specification implies LivenessProperty

  PROPERTY Liveness
    \* Tells TLC to check that specification implies Liveness

  PROPERTY AlwaysBusy


  CONSTANTS
    Send  <- MCSend
    Reply <- MCReply
    InitMemInt <- MCInitMemInt
      \* These declarations tell TLC to substitute MCSend for Send,
      \* MCReply for Reply, and MCInitMemInt for InitMemInt.
    p1 = p1
    p2 = p2
    Proc = {p1, p2}
      \* This tells TLC to let Proc be a set consisting of the two
      \* uninterpreted constants p1 and p2.

    a1 = a1
    a2 = a2
    a3 = a3
    Adr = {a1, a2, a3}
      \* This tells TLC to let Adr be a set consisting of the three
      \* uninterpreted constants a1, a2, and a3.

    v1 = v1
    v2 = v2
    Val = {v1, v2}
      \* This tells TLC to let Val be a set consisting of the two
      \* uninterpreted constants v1 and v2.

    NoVal = NoVal
      \* TLC cannot handle the unbounded CHOOSE in the definition of
      \* NoVal.  This statement tells TLC to ignore that definition and to
      \* treat NoVal as an uninterpreted constant.

  (***************************************************************************)
  (* Note that "<-" tells TLC to replace a symbol with one defined in the    *)
  (* module, while "=" tells it to replace a symbol with one involving new,  *)
  (* uninterpreted constants.                                                *)
  (***************************************************************************)
  POSTCONDITION PostCondition
args:
  - -lncheck
  - final
  - -deadlock
includes:
  - LiveInternalMemory.tla
  - InternalMemory.tla
  - MemoryInterface.tla
---*)
---------------------- MODULE MCLiveInternalMemory -------------------------
(***************************************************************************)
(* This is a module used for running TLC to check the specification LISpec *)
(* of LiveInternalMemory.  We need to tell TLC the values of the constant  *)
(* operators Send and Reply.  We define operators MCSend and MCReply and   *)
(* use the configuration file to tell TLC to substitute these operators    *)
(* for Send and Reply.  We also define MCInitMemInt, which is substituted  *)
(* for InitMemInt.                                                         *)
(*                                                                         *)
(* This module is identical to module MCInternalMemory                     *)
(* from folder CachingMemory, except it EXTENDS module LiveInternalMemory  *)
(* instead of InternalMemory.                                              *)
(***************************************************************************)

EXTENDS LiveInternalMemory, TLC, TLCExt

(***************************************************************************)
(* The operator Send is used in specifications in conjuncts of the form    *)
(*                                                                         *)
(* (+)  Send(p, d, memInt, memInt')                                        *)
(*                                                                         *)
(* to specify the new value of memInt.  For TLC to handle such a           *)
(* conjunct, the definition of Send must make (+) equal something of the   *)
(* form                                                                    *)
(*                                                                         *)
(*   memInt' = ...                                                         *)
(*                                                                         *)
(* (A similar observation holds for Reply.)  We define Send so that (+)    *)
(* equals                                                                  *)
(*                                                                         *)
(*   memInt' = <<p, d>>                                                    *)
(*                                                                         *)
(* If we were doing serious model checking, we might try to reduce         *)
(* the state space by letting the value of memInt remain constant,         *)
(* so we would define Send so that (+) equals                              *)
(*                                                                         *)
(*   memInt' = memInt.                                                     *)
(***************************************************************************)
MCSend(p, d, oldMemInt, newMemInt)  ==  newMemInt = <<p, d>>
MCReply(p, d, oldMemInt, newMemInt) ==  newMemInt = <<p, d>>

(***************************************************************************)
(* We define MCInitMemInt, the set of initial values of memInt, to contain *)
(* the single element <<p, NoVal>>, for an arbitrary processor p.          *)
(***************************************************************************)
MCInitMemInt == {<<CHOOSE p \in Proc : TRUE, NoVal>>}

AlwaysBusy == \A p \in Proc : []<>(ctl[p] = "busy")

CONSTANT p1, p2, a1, a2, a3, v1, v2

PostCondition ==
   CounterExample = 
   [ action |->
      { << << 1,
              [ ctl |-> (p1 :> "rdy" @@ p2 :> "rdy"),
                memInt |-> <<p1, NoVal>>,
                mem |-> (a1 :> v1 @@ a2 :> v1 @@ a3 :> v1),
                buf |-> (p1 :> NoVal @@ p2 :> NoVal) ] >>,
           [ name |-> "Req",
             location |->
                 [ beginLine |-> 15,
                   beginColumn |-> 11,
                   endLine |-> 20,
                   endColumn |-> 26,
                   module |-> "InternalMemory" ],
             context |-> [p |-> p2],
             parameters |-> <<"p">> ],
           << 2,
              [ ctl |-> (p1 :> "rdy" @@ p2 :> "busy"),
                memInt |-> <<p2, [val |-> v1, op |-> "Wr", adr |-> a2]>>,
                mem |-> (a1 :> v1 @@ a2 :> v1 @@ a3 :> v1),
                buf |->
                    ( p1 :> NoVal @@
                      p2 :> [val |-> v1, op |-> "Wr", adr |-> a2] ) ] >> >>,
        << << 2,
              [ ctl |-> (p1 :> "rdy" @@ p2 :> "busy"),
                memInt |-> <<p2, [val |-> v1, op |-> "Wr", adr |-> a2]>>,
                mem |-> (a1 :> v1 @@ a2 :> v1 @@ a3 :> v1),
                buf |->
                    ( p1 :> NoVal @@
                      p2 :> [val |-> v1, op |-> "Wr", adr |-> a2] ) ] >>,
           [ name |-> "Do",
             location |->
                 [ beginLine |-> 23,
                   beginColumn |-> 3,
                   endLine |-> 31,
                   endColumn |-> 21,
                   module |-> "InternalMemory" ],
             context |-> [p |-> p2],
             parameters |-> <<"p">> ],
           << 3,
              [ ctl |-> (p1 :> "rdy" @@ p2 :> "done"),
                memInt |-> <<p2, [val |-> v1, op |-> "Wr", adr |-> a2]>>,
                mem |-> (a1 :> v1 @@ a2 :> v1 @@ a3 :> v1),
                buf |-> (p1 :> NoVal @@ p2 :> NoVal) ] >> >>,
        << << 3,
              [ ctl |-> (p1 :> "rdy" @@ p2 :> "done"),
                memInt |-> <<p2, [val |-> v1, op |-> "Wr", adr |-> a2]>>,
                mem |-> (a1 :> v1 @@ a2 :> v1 @@ a3 :> v1),
                buf |-> (p1 :> NoVal @@ p2 :> NoVal) ] >>,
           [ name |-> "Rsp",
             location |->
                 [ beginLine |-> 33,
                   beginColumn |-> 11,
                   endLine |-> 36,
                   endColumn |-> 35,
                   module |-> "InternalMemory" ],
             context |-> [p |-> p2],
             parameters |-> <<"p">> ],
           << 4,
              [ ctl |-> (p1 :> "rdy" @@ p2 :> "rdy"),
                memInt |-> <<p2, NoVal>>,
                mem |-> (a1 :> v1 @@ a2 :> v1 @@ a3 :> v1),
                buf |-> (p1 :> NoVal @@ p2 :> NoVal) ] >> >>,
        << << 4,
              [ ctl |-> (p1 :> "rdy" @@ p2 :> "rdy"),
                memInt |-> <<p2, NoVal>>,
                mem |-> (a1 :> v1 @@ a2 :> v1 @@ a3 :> v1),
                buf |-> (p1 :> NoVal @@ p2 :> NoVal) ] >>,
           [ name |-> "Req",
             location |->
                 [ beginLine |-> 15,
                   beginColumn |-> 11,
                   endLine |-> 20,
                   endColumn |-> 26,
                   module |-> "InternalMemory" ],
             context |-> [p |-> p2],
             parameters |-> <<"p">> ],
           << 2,
              [ ctl |-> (p1 :> "rdy" @@ p2 :> "busy"),
                memInt |-> <<p2, [val |-> v1, op |-> "Wr", adr |-> a2]>>,
                mem |-> (a1 :> v1 @@ a2 :> v1 @@ a3 :> v1),
                buf |->
                    ( p1 :> NoVal @@
                      p2 :> [val |-> v1, op |-> "Wr", adr |-> a2] ) ] >> >> },
  state |->
      { << 1,
           [ ctl |-> (p1 :> "rdy" @@ p2 :> "rdy"),
             memInt |-> <<p1, NoVal>>,
             mem |-> (a1 :> v1 @@ a2 :> v1 @@ a3 :> v1),
             buf |-> (p1 :> NoVal @@ p2 :> NoVal) ] >>,
        << 2,
           [ ctl |-> (p1 :> "rdy" @@ p2 :> "busy"),
             memInt |-> <<p2, [val |-> v1, op |-> "Wr", adr |-> a2]>>,
             mem |-> (a1 :> v1 @@ a2 :> v1 @@ a3 :> v1),
             buf |->
                 ( p1 :> NoVal @@
                   p2 :> [val |-> v1, op |-> "Wr", adr |-> a2] ) ] >>,
        << 3,
           [ ctl |-> (p1 :> "rdy" @@ p2 :> "done"),
             memInt |-> <<p2, [val |-> v1, op |-> "Wr", adr |-> a2]>>,
             mem |-> (a1 :> v1 @@ a2 :> v1 @@ a3 :> v1),
             buf |-> (p1 :> NoVal @@ p2 :> NoVal) ] >>,
        << 4,
           [ ctl |-> (p1 :> "rdy" @@ p2 :> "rdy"),
             memInt |-> <<p2, NoVal>>,
             mem |-> (a1 :> v1 @@ a2 :> v1 @@ a3 :> v1),
             buf |-> (p1 :> NoVal @@ p2 :> NoVal) ] >> } ]
=============================================================================

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 3 branches.
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2190:0 Finished computing initial states: 8 distinct states generated at <date>.
    2192:0 Checking 3 branches of temporal properties for the complete state space with 13224 total distinct states at (<date>)
    2116:1 Temporal property AlwaysBusy was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    /\ mem = (a1 :> v1 @@ a2 :> v1 @@ a3 :> v1)
    /\ ctl = (p1 :> "rdy" @@ p2 :> "rdy")
    /\ buf = (p1 :> NoVal @@ p2 :> NoVal)
    /\ memInt = <<p1, NoVal>>
    2217:4 2: <Req(p2) line 15, col 11 to line 20, col 26 of module InternalMemory>
    /\ mem = (a1 :> v1 @@ a2 :> v1 @@ a3 :> v1)
    /\ ctl = (p1 :> "rdy" @@ p2 :> "busy")
    /\ buf = (p1 :> NoVal @@ p2 :> [val |-> v1, op |-> "Wr", adr |-> a2])
    /\ memInt = <<p2, [val |-> v1, op |-> "Wr", adr |-> a2]>>
    2217:4 3: <Do(p2) line 23, col 3 to line 31, col 21 of module InternalMemory>
    /\ mem = (a1 :> v1 @@ a2 :> v1 @@ a3 :> v1)
    /\ ctl = (p1 :> "rdy" @@ p2 :> "done")
    /\ buf = (p1 :> NoVal @@ p2 :> NoVal)
    /\ memInt = <<p2, [val |-> v1, op |-> "Wr", adr |-> a2]>>
    2217:4 4: <Rsp(p2) line 33, col 11 to line 36, col 35 of module InternalMemory>
    /\ mem = (a1 :> v1 @@ a2 :> v1 @@ a3 :> v1)
    /\ ctl = (p1 :> "rdy" @@ p2 :> "rdy")
    /\ buf = (p1 :> NoVal @@ p2 :> NoVal)
    /\ memInt = <<p2, NoVal>>
    2122:4 2: Back to state: <Req(p2) line 15, col 11 to line 20, col 26 of module InternalMemory>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 21400 states generated, 4408 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 10.
---*)
