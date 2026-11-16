(*---
description: Ported from TLC's ExamplesLockHSTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/ExamplesLockHSTest.java
features:
  - tlc-regression
outcome: success
config: |-
  SPECIFICATION SpecHS
  INVARIANTS TypeOKHS InvHS LockInv
  PROPERTIES Spec PSpec
args:
  - -lncheck
  - final
  - -deadlock
includes:
  - Lock.tla
  - Stuttering.tla
  - Peterson.tla
---*)
-------------------------------- MODULE LockHS --------------------------------

(*****************************************************************************)
(* This module contains the specification of a lock with auxiliary variables.*)
(* 1. A history variable `h_turn` is needed to remember the assignement of   *)
(*    the turn variable used inside the Peterson specification.              *)
(* 2. A stuttering variable `s` is added to force the stuttering of the Lock *)
(*    specification to mimick the 3 steps taken by Peterson to enter the     *)
(*    critical section.                                                      *)
(* With these variables, one can finally refine LockHS to Peterson, giving   *)
(* an equivalence between the Lock and Peterson specifications.              *)
(*                                                                           *)
(* The stuttering is achieved using the Stuttering module created by Leslie  *)
(* Lamport and comes from to the paper "Auxiliary Variables in TLA+".        *)
(* The module used here has been modified, see explanations at the end of    *) 
(* the Stuttering module.                                                    *)
(*****************************************************************************)

EXTENDS Lock

\* History variable to remember the turn variable
VARIABLE h_turn
NoHistoryChange(A) == A /\ UNCHANGED h_turn

\* Stuttering variable
VARIABLE s
INSTANCE Stuttering

-------------------------------------------------------------------------------

Other(p) == IF p = 1 THEN 2 ELSE 1 

InitHS == Init /\ (h_turn = 1) /\ (s = top)

\* Adding 2 stuttering steps after an l1(self) transition
\* Updating the history variable during the right stutter step
l1HS(self) == 
  /\ PostStutter(l1(self), "l1", self, 1, 2, LAMBDA j : j-1)
  /\ h_turn' = IF s' # top THEN IF s'.val = 1 THEN Other(self)
                                              ELSE h_turn
                           ELSE h_turn

procHS(self) == 
  \/ NoStutter(NoHistoryChange(l0(self)))
  \/ l1HS(self)
  \/ NoStutter(NoHistoryChange(cs(self)))
  \/ NoStutter(NoHistoryChange(l2(self)))

NextHS == (\E self \in 1..2: procHS(self))

SpecHS == InitHS /\ [][NextHS]_<<vars, h_turn, s>>

-------------------------------------------------------------------------------

TypeOKHS == 
  /\ TypeOK
  /\ h_turn \in 1..2
  /\ s \in {top} \cup [id : {"l1"}, ctxt : {1, 2}, val : 1..2]

InvHS == 
  /\ \A p \in ProcSet : 
    /\ IF s # top THEN s.ctxt = p ELSE FALSE
    => pc[p] = "cs"
  /\ \A p \in ProcSet :
    \/ pc[p] = "l2"
    \/ pc[p] = "cs" /\ s = top
    \/ IF s # top THEN s.ctxt = p /\ s.val = 1 ELSE FALSE
    => h_turn = Other(p)

pc_translation(self, label, stutter) == 
  CASE (label = "l0") -> "a0"
    [] (label = "l1") -> "a1"
    [] (label = "l2") -> "a4"
    [] (label = "cs") -> IF stutter = top THEN "cs"
                         ELSE IF stutter.ctxt # self THEN "cs"
                         ELSE IF stutter.val = 2 THEN "a2"
                         ELSE IF stutter.val = 1 THEN "a3"
                         ELSE "error"
c_translation(alt_label) == 
  alt_label \in {"a2", "a3", "cs", "a4"}

P == INSTANCE Peterson WITH
      pc <- [p \in ProcSet |-> pc_translation(p, pc[p], s)],
      c <- [p \in ProcSet |-> c_translation(pc_translation(p, pc[p], s))],
      turn <- h_turn
PSpec == P!Spec

===============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    | line 68, col 9 to line 68, col 11 of module Stuttering
    | The field name "top" in the record constructor is identical to the existing definition or declaration
    | named top, located at line 68, col 1 to line 68, col 22 of module Stuttering.
    | The field in the record will not take the value of the top definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [top |-> ...] = {"top"} holds true.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 2.0E-17
    2199:0 41 states generated, 28 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 10.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 2 and the 95th percentile is 2).
---*)
