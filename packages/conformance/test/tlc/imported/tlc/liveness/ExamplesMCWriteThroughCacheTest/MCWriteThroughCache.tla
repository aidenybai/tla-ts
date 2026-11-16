(*---
description: Ported from TLC's ExamplesMCWriteThroughCacheTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/ExamplesMCWriteThroughCacheTest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |
  SPECIFICATION Spec

  INVARIANTS TypeInvariant Coherence LM_Inner_TypeInvariant
    \* This tells TLC to check the invariants TypeInvariant, Coherence,
    \* and LM_Inner_TypeInvariant

  PROPERTY LM_Inner_ISpec
      BusyLeadsToRdy
     \* This tells TLC to check that the specification implies LM_Inner_ISpec,
     \* the formula obtained from specification ISpec of module
     \* InternalMemory by substituting the refinement mapping from the
     \* section titled "Proving Implementation".


  (***************************************************************************)
  (* The values of the following constants are chosen to produce a very      *)
  (* small model that TLC can check very quickly.  You should try enlarging  *)
  (* the model gradually to see how quickly the set of states "explodes".    *)
  (***************************************************************************)
  CONSTANTS
    Send  <- MCSend
    Reply <- MCReply
    InitMemInt <- MCInitMemInt
      \* These declarations tell TLC to substitute MCSend for Send,
      \* MCReply for Reply, and MCInitMemInt for InitMemInt.

    Proc = {p1, p2}
      \* This tells TLC to let Proc be a set consisting of the two
      \* uninterpreted constants p1 and p2.

    Adr = {a1}
      \* This tells TLC to let Adr be a set consisting of the single
      \* uninterpreted constant a1.

    Val = {v1, v2}
      \* This tells TLC to let Val be a set consisting of the two
      \* uninterpreted constants v1 and v2.

    NoVal = NoVal
      \* TLC cannot handle the unbounded CHOOSE in the definition of
      \* NoVal.  This statement tells TLC to ignore that definition and to
      \* treat NoVal as an uninterpreted constant.

    QLen = 1
      \* This tells TLC to let QLen equal 1.

  (***************************************************************************)
  (* Note that "<-" tells TLC to replace a symbol with one defined in the    *)
  (* module, while "=" tells it to replace a symbol with one involving new,  *)
  (* uninterpreted constants.                                                *)
  (***************************************************************************)
args:
  - -lncheck
  - final
  - -deadlock
includes:
  - WriteThroughCacheInstanced.tla
  - MemoryInterface.tla
  - InternalMemory.tla
  - Memory.tla
---*)
------------------------- MODULE MCWriteThroughCache ------------------------
(***************************************************************************)
(* This is a module used for running TLC to check the specification of the *)
(* write-through cache in module WriteThroughCache.  Because TLC version 1 *)
(* can't handle instantiation, we use module WriteThroughCacheInstanced in *)
(* its stead.  We check that the specification satisfies the type          *)
(* invariant and the invariant Coherence.  We also check that it           *)
(* implements the InternalMemory specification under the refinement        *)
(* mapping described in the section "Proving Implementation".              *)
(***************************************************************************)

EXTENDS WriteThroughCacheInstanced

(***************************************************************************)
(* The following definitions are substituted for the constants Send,       *)
(* Reply, and InitMemInt of the MemoryFace module.  See                    *)
(* MCInternalMemory.tla for their explanations.                            *)
(***************************************************************************)
MCSend(p, d, oldMemInt, newMemInt)  ==  newMemInt = <<p, d>>
MCReply(p, d, oldMemInt, newMemInt) ==  newMemInt = <<p, d>>
MCInitMemInt == {<<CHOOSE p \in Proc : TRUE, NoVal>>}

(***************************************************************************)
(* As described in the section titled "Proving Implementation", the        *)
(* write-through cache specifies Spec satisfies                            *)
(*                                                                         *)
(*    Spec => LM!Inner(omem, octl, obuf)!ISpec                             *)
(*                                                                         *)
(* for the following choices of omem, octl, and obuf:                      *)
(***************************************************************************)

   omem == vmem
   octl == [p \in Proc |-> IF ctl[p] = "waiting" THEN "busy" ELSE ctl[p]]
   obuf == buf

(***************************************************************************)
(* Formula LM!Inner(omem, octl, obuf)!ISpec consists of formula ISpec of   *)
(* module InternalMemory with the substitutions                            *)
(*                                                                         *)
(* (+)   mem <- omem, ctl <- octl, buf <- obuf                             *)
(*                                                                         *)
(* Because TLC Version 1 cannot handle instantiation, we now do the        *)
(* instantiation "by hand".  So, below is a copy of module InternalMemory  *)
(* with the substitutions (+) made, and with the names of all defined      *)
(* operators prefixed with "LM_Inner_".  (Had we used the actual INSTANCE  *)
(* statements, those names would actually be prefixed by                   *)
(* "LM!Inner(mem, ctl, buf)!", where mem, ctl, and buf would be parameters *)
(* of the definitions.)                                                    *)
(***************************************************************************)

LM_Inner_IInit == /\ omem \in [Adr->Val]
                  /\ octl = [p \in Proc |-> "rdy"] 
                  /\ obuf = [p \in Proc |-> NoVal] 
                  /\ memInt \in InitMemInt

LM_Inner_TypeInvariant == 
  /\ omem \in [Adr->Val]
  /\ octl \in [Proc -> {"rdy", "busy","done"}] 
  /\ obuf \in [Proc -> MReq \cup Val \cup {NoVal}]

LM_Inner_Req(p) == /\ octl[p] = "rdy" 
          /\ \E req \in  MReq : 
                /\ Send(p, req, memInt, memInt') 
                /\ obuf' = [obuf EXCEPT ![p] = req]
                /\ octl' = [octl EXCEPT ![p] = "busy"]
          /\ UNCHANGED omem 

LM_Inner_Do(p) == 
  /\ octl[p] = "busy" 
  /\ omem' = IF obuf[p].op = "Wr"
              THEN [omem EXCEPT ![obuf[p].adr] = obuf[p].val] 
              ELSE omem 
  /\ obuf' = [obuf EXCEPT ![p] = IF obuf[p].op = "Wr"
                                  THEN NoVal
                                  ELSE omem[obuf[p].adr]]
  /\ octl' = [octl EXCEPT ![p] = "done"] 
  /\ UNCHANGED memInt 

LM_Inner_Rsp(p) == /\ octl[p] = "done"
                   /\ Reply(p, obuf[p], memInt, memInt')
                   /\ octl' = [octl EXCEPT ![p]= "rdy"]
                   /\ UNCHANGED <<omem, obuf>> 

LM_Inner_INext == 
     \E p \in Proc: LM_Inner_Req(p) \/ LM_Inner_Do(p) \/ LM_Inner_Rsp(p) 

LM_Inner_ISpec == 
    LM_Inner_IInit  /\  [][LM_Inner_INext]_<<memInt, omem, octl, obuf>>
-----------------------------------------------------------------------------
THEOREM LM_Inner_ISpec => []LM_Inner_TypeInvariant

BusyLeadsToRdy == \A p \in Proc : (ctl[p] = "busy") ~> (ctl[p] = "rdy")
=============================================================================

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 2 branches.
    2190:0 Finished computing initial states: 2 distinct states generated at <date>.
    2192:0 Checking 2 branches of temporal properties for the complete state space with 10392 total distinct states at (<date>)
    2116:1 Temporal property BusyLeadsToRdy was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    /\ wmem = (a1 :> v1)
    /\ memQ = <<>>
    /\ ctl = (p1 :> "rdy" @@ p2 :> "rdy")
    /\ buf = (p1 :> NoVal @@ p2 :> NoVal)
    /\ cache = (p1 :> (a1 :> NoVal) @@ p2 :> (a1 :> NoVal))
    /\ memInt = <<p1, NoVal>>
    2217:4 2: <Req(p1) line 85, col 11 to line 85, col 47 of module WriteThroughCacheInstanced>
    /\ wmem = (a1 :> v1)
    /\ memQ = <<>>
    /\ ctl = (p1 :> "busy" @@ p2 :> "rdy")
    /\ buf = (p1 :> [op |-> "Wr", adr |-> a1, val |-> v1] @@ p2 :> NoVal)
    /\ cache = (p1 :> (a1 :> NoVal) @@ p2 :> (a1 :> NoVal))
    /\ memInt = <<p1, [op |-> "Wr", adr |-> a1, val |-> v1]>>
    2217:4 3: <Req(p2) line 85, col 11 to line 85, col 47 of module WriteThroughCacheInstanced>
    /\ wmem = (a1 :> v1)
    /\ memQ = <<>>
    /\ ctl = (p1 :> "busy" @@ p2 :> "busy")
    /\ buf = ( p1 :> [op |-> "Wr", adr |-> a1, val |-> v1] @@
      p2 :> [op |-> "Wr", adr |-> a1, val |-> v2] )
    /\ cache = (p1 :> (a1 :> NoVal) @@ p2 :> (a1 :> NoVal))
    /\ memInt = <<p2, [op |-> "Wr", adr |-> a1, val |-> v2]>>
    2217:4 4: <DoWr(p1) line 105, col 7 to line 114, col 35 of module WriteThroughCacheInstanced>
    /\ wmem = (a1 :> v1)
    /\ memQ = <<<<p1, [op |-> "Wr", adr |-> a1, val |-> v1]>>>>
    /\ ctl = (p1 :> "done" @@ p2 :> "busy")
    /\ buf = (p1 :> NoVal @@ p2 :> [op |-> "Wr", adr |-> a1, val |-> v2])
    /\ cache = (p1 :> (a1 :> v1) @@ p2 :> (a1 :> NoVal))
    /\ memInt = <<p2, [op |-> "Wr", adr |-> a1, val |-> v2]>>
    2217:4 5: <MemQWr line 126, col 15 to line 129, col 54 of module WriteThroughCacheInstanced>
    /\ wmem = (a1 :> v1)
    /\ memQ = <<>>
    /\ ctl = (p1 :> "done" @@ p2 :> "busy")
    /\ buf = (p1 :> NoVal @@ p2 :> [op |-> "Wr", adr |-> a1, val |-> v2])
    /\ cache = (p1 :> (a1 :> v1) @@ p2 :> (a1 :> NoVal))
    /\ memInt = <<p2, [op |-> "Wr", adr |-> a1, val |-> v2]>>
    2217:4 6: <Evict(p1,a1) line 139, col 15 to line 141, col 59 of module WriteThroughCacheInstanced>
    /\ wmem = (a1 :> v1)
    /\ memQ = <<>>
    /\ ctl = (p1 :> "done" @@ p2 :> "busy")
    /\ buf = (p1 :> NoVal @@ p2 :> [op |-> "Wr", adr |-> a1, val |-> v2])
    /\ cache = (p1 :> (a1 :> NoVal) @@ p2 :> (a1 :> NoVal))
    /\ memInt = <<p2, [op |-> "Wr", adr |-> a1, val |-> v2]>>
    2218:4 7: Stuttering
    2259:3 The stuttering counterexample above may be caused by the absence of a fairness constraint in the behavior specification Spec defined at line 148, col 1 to line 149, col 58 of module WriteThroughCacheInstanced. To rule out such counterexamples, conjoin a suitable fairness constraint to Spec (compare Chapter 8, page 87ff of Specifying Systems at https://lamport.azurewebsites.net/tla/book.html).
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 28170 states generated, 5196 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 18.
---*)
