(*---
description: Ported from TLC's ExamplesMCLiveWriteThroughCacheTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/ExamplesMCLiveWriteThroughCacheTest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |
  SPECIFICATION LSpec


  PROPERTY LM_Inner_LISpec 
     \* This tells TLC to check that the specification implies LM_Inner_LISpec,
     \* the formula obtained from specification LISpec of module
     \* LiveInternalMemory by substituting the refinement mapping from the
     \* section "Proving Implementation" of the chapter "A Caching Memory"

  PROPERTY LM_Inner_Liveness

     \* This tells TLC to check that the specification implies
     \* LM_InnerLiveness.  We've already checked that LISpec implies
     \* Liveness, so LM_Inner_LISpec should imply LM_Inner_Liveness, so
     \* this should hold if the preceding PROPERTY does.  But, it's a
     \* good idea to check even things that should be consequences of
     \* things we've already checked, just in case we've made an error
     \* somewhere along the line.

  PROPERTY LM_Inner_LivenessProperty

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
    p1 = p1
    p2 = p2
    Proc = {p1, p2}
      \* This tells TLC to let Proc be a set consisting of the two
      \* uninterpreted constants p1 and p2.
    a1 = a1
    Adr = {a1}
      \* This tells TLC to let Adr be a set consisting of the single
      \* uninterpreted constant a1.
    v1 = v1
    v2 = v2
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

  PROPERTY PermanentlyBusy

  POSTCONDITION
    PostCondition
args:
  - -lncheck
  - final
  - -deadlock
includes:
  - LiveWriteThroughCache.tla
  - WriteThroughCacheInstanced.tla
  - MemoryInterface.tla
  - InternalMemory.tla
  - Memory.tla
---*)
----------------------- MODULE MCLiveWriteThroughCache ----------------------
(***************************************************************************)
(* This is a module used for running TLC to check the specification of the *)
(* write-through cache in module LiveWriteThroughCache.  We check that it  *)
(* implements the LiveInternalMemory specification under the refinement    *)
(* mapping described in the section "Proving Implementation" of chapter "A *)
(* Caching Memory".                                                        *)
(*                                                                         *)
(* This module is the same as module MCWriteThroughCache of the folder     *)
(* CachingMemory, except it also "instantiates" the definition of LISpec.  *)
(***************************************************************************)

EXTENDS LiveWriteThroughCache, TLC, TLCExt

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
(* If we extended what we did in the chapter "A Caching Memory" to the     *)
(* specifications with liveness, we would have a module LiveMemory that    *)
(* hides the internal variables of LiveInnerMemory, and module             *)
(* LiveWriteThroughCache would contain                                     *)
(*                                                                         *)
(*    LM == INSTANCE LiveMemory                                            *)
(*    THEOREM LSpec => LM!LSpec                                            *)
(*                                                                         *)
(* we would prove this by proving                                          *)
(*                                                                         *)
(* (1)   LSpec => LM!Inner(omem, octl, obuf)!LISpec                        *)
(*                                                                         *)
(* where Formula LM!Inner(omem, octl, obuf)!LISpec is formula LISpec of    *)
(* module LiveInternalMemory with the substitutions                        *)
(*                                                                         *)
(* (2)   mem <- omem, ctl <- octl, buf <- obuf                             *)
(*                                                                         *)
(* We now use TLC to check (1).  Because TLC Version 1 cannot handle       *)
(* instantiation, we do the instantiation "by hand".  So, below is a copy  *)
(* of the definitions from module LiveInternalMemory with the              *)
(* substitutions (2) made, and with the names of all defined operators     *)
(* prefixed with "LM_Inner_".  (Had we used the actual INSTANCE            *)
(* statements, those names would actually be prefixed by "LM!Inner(mem,    *)
(* ctl, buf)!", where mem, ctl, and buf would be parameters of the         *)
(* definitions.)  These definitions are all the same as in module          *)
(* MCWriteThroughCache in the folder CachingMemory, except with the        *)
(* additional definitions of LM_Inner_vars, LM_Inner_Liveness,             *)
(* LM_Inner_Liveness2, and LM_Inner_LISpec.  The definitions of            *)
(* LM_Inner_Liveness and LM_Inner_Liveness2 are tricky.                    *)
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

LM_Inner_vars == <<memInt, omem, octl, obuf>>


LM_Inner_EnabledDo(p)  == octl[p] = "busy" 
  (*************************************************************************)
  (* The instantiation of ENABLED Do(p).  See the section titled           *)
  (* "Refinement Mappings and Fairness".                                   *)
  (*************************************************************************)
  
LM_Inner_EnabledRsp(p) == octl[p] = "done"
  (*************************************************************************)
  (* The instantiation of ENABLED Rsp(p).  See the section titled          *)
  (* "Refinement Mappings and Fairness".                                   *)
  (*************************************************************************)


(***************************************************************************)
(* See the See the section titled "Refinement Mappings and Fairness".  for *)
(* an explanation of why the following are the appropriate definitions of  *)
(* LM_Inner_Liveness and LM_Inner_Liveness2.                               *)
(***************************************************************************)
LM_Inner_Liveness == 
  \A p \in Proc : 
    /\ []<>~LM_Inner_EnabledDo(p) \/ []<><<LM_Inner_Do(p)>>_LM_Inner_vars
    /\ []<>~LM_Inner_EnabledRsp(p) \/ []<><<LM_Inner_Rsp(p)>>_LM_Inner_vars

LM_Inner_Liveness2 == 
  \A p \in Proc : 
    \/ []<>~(LM_Inner_EnabledDo(p) \/ LM_Inner_EnabledRsp(p))
    \/ []<><<LM_Inner_Do(p) \/ LM_Inner_Rsp(p)>>_LM_Inner_vars

  
LM_Inner_LISpec == LM_Inner_ISpec /\ LM_Inner_Liveness2

LM_Inner_LivenessProperty == 
   \A p \in Proc : (octl[p] = "req") ~> (octl[p] = "rdy")

PermanentlyBusy == \A p \in Proc : []<><<DoRd(p)>>_vars

CONSTANT p1, p2, a1, v1, v2
PostCondition ==
   CounterExample =
   [ action |->
      { << << 1,
              [ ctl |-> (p1 :> "rdy" @@ p2 :> "rdy"),
                buf |-> (p1 :> NoVal @@ p2 :> NoVal),
                memInt |-> <<p1, NoVal>>,
                wmem |-> (a1 :> v1),
                cache |-> (p1 :> (a1 :> NoVal) @@ p2 :> (a1 :> NoVal)),
                memQ |-> <<>> ] >>,
           [ name |-> "UnnamedAction",
             location |->
                 [ beginLine |-> 0,
                   beginColumn |-> 0,
                   endLine |-> 0,
                   endColumn |-> 0,
                   module |-> "--TLA+ BUILTINS--" ] ],
           << 1,
              [ ctl |-> (p1 :> "rdy" @@ p2 :> "rdy"),
                buf |-> (p1 :> NoVal @@ p2 :> NoVal),
                memInt |-> <<p1, NoVal>>,
                wmem |-> (a1 :> v1),
                cache |-> (p1 :> (a1 :> NoVal) @@ p2 :> (a1 :> NoVal)),
                memQ |-> <<>> ] >> >> },
  state |->
      { << 1,
           [ ctl |-> (p1 :> "rdy" @@ p2 :> "rdy"),
             buf |-> (p1 :> NoVal @@ p2 :> NoVal),
             memInt |-> <<p1, NoVal>>,
             wmem |-> (a1 :> v1),
             cache |-> (p1 :> (a1 :> NoVal) @@ p2 :> (a1 :> NoVal)),
             memQ |-> <<>> ] >> } ]


=============================================================================

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 3 branches.
    2190:0 Finished computing initial states: 2 distinct states generated at <date>.
    2192:0 Checking 3 branches of temporal properties for the complete state space with 15588 total distinct states at (<date>)
    2116:1 Temporal property PermanentlyBusy was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    /\ ctl = (p1 :> "rdy" @@ p2 :> "rdy")
    /\ memInt = <<p1, NoVal>>
    /\ wmem = (a1 :> v1)
    /\ buf = (p1 :> NoVal @@ p2 :> NoVal)
    /\ memQ = <<>>
    /\ cache = (p1 :> (a1 :> NoVal) @@ p2 :> (a1 :> NoVal))
    2218:4 2: Stuttering
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 28170 states generated, 5196 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 18.
---*)
