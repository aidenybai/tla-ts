(*---
description: Ported from TLC's ExamplesPrisonersTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/ExamplesPrisonersTest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |-
  CONSTANT p1 = p1
           p2 = p2
           p3 = p3
           p4 = p4
           Prisoner = {p1, p2, p3, p4}
           Counter  = p1
  SPECIFICATION Spec
  INVARIANT TypeOK CountInvariant
  PROPERTIES Safety Liveness CountInfOftenZero
  POSTCONDITION PostCondition
args:
  - -lncheck
  - final
  - -deadlock
---*)
------------------------------ MODULE Prisoners ----------------------------- 
(***************************************************************************)
(* This module specifies the solution to the following puzzle, given on    *)
(* the Car Guys NPR radio show:                                            *)
(*                                                                         *)
(*    The warden of a prison gives his prisoners the following problem.    *)
(*    There is a room in the prison with two switches, labeled A and B.    *)
(*    Each switch can be either up or down.  Every so often, the warden    *)
(*    will select a prisoner at random and take him into the room, where   *)
(*    he must flip (change the position of) exactly one of the switches.   *)
(*    The only guarantee he makes is that every prisoner will eventually   *)
(*    be brought into the room multiple times.  (More precisely, there     *)
(*    will never be a time after which some prisoner is never again        *)
(*    brought into the room.)                                              *)
(*                                                                         *)
(*    At any time, any prisoner may declare that all the prisoners have    *)
(*    been in the room at least once.  If that prisoner is right, then     *)
(*    all the prisoners go free.  If he is wrong, all the prisoners are    *)
(*    immediately executed.                                                *)
(*                                                                         *)
(*    The prisoners are allowed to decide upon a strategy, after which     *)
(*    they will not be allowed to communicate with one another.  And, of   *)
(*    course, they cannot see the room or who is being brought into it.    *)
(*    What do they do?                                                     *)
(*                                                                         *)
(* The solution presented by the Car Guys is specified below.              *)
(***************************************************************************)
EXTENDS Naturals, FiniteSets, TLC, TLCExt

CONSTANTS 
  Prisoner,
    (***********************************************************************)
    (* The set of all prisoners.                                           *)
    (***********************************************************************)

  Counter  
    (***********************************************************************)
    (* This is an arbitrarily chosen prisoner, who will do the necessary   *)
    (* counting.                                                           *)
    (***********************************************************************)

ASSUME 
  (*************************************************************************)
  (* We assume that the counter is a prisoner.  We also assume that there  *)
  (* is more than one prisoner.  (The problem is trivial if there is a     *)
  (* single prisoner.)                                                     *)
  (*************************************************************************)
  /\ Counter \in Prisoner
  /\ Cardinality(Prisoner) > 1

OtherPrisoner == Prisoner \ {Counter}
  (*************************************************************************)
  (* The set of all prisoners other than the counter.                      *)
  (*************************************************************************)
  
VARIABLES 
  switchAUp, switchBUp,    
    (***********************************************************************)
    (* The states of the two switches, represented by boolean-valued       *)
    (* variables.                                                          *)
    (***********************************************************************)
    
  timesSwitched,
    (***********************************************************************)
    (* For ever prisoner except the counter, timesSwitched[p] is the       *)
    (* number of times prisoner p has moved switch A up.  It is initially  *)
    (* 0 and will equal at most 2.                                         *)
    (***********************************************************************)

  count
    (***********************************************************************)
    (* The number of times the Counter has switched switch A down.         *)
    (***********************************************************************)

vars == <<switchAUp, switchBUp, timesSwitched, count>>    
  (*************************************************************************)
  (* The tuple of all variables.                                           *)
  (*************************************************************************)
-----------------------------------------------------------------------------
(***************************************************************************)
(* We first define three state predicates.                                 *)
(***************************************************************************)
TypeOK == 
  (*************************************************************************)
  (* The type-correctness invariant.  This is not actually part of the     *)
  (* specification.  It is added to help the reader understand the         *)
  (* specification and also because letting TLC (the model checker) check  *)
  (* that it is an invariant is a good way to debug the specification.     *)
  (*                                                                       *)
  (* Note the bound on the value of count.                                 *)
  (*************************************************************************)
  /\ switchAUp     \in BOOLEAN
  /\ switchBUp     \in BOOLEAN
  /\ timesSwitched \in [OtherPrisoner -> 0..2]
  /\ count         \in 0 .. (2 * Cardinality(Prisoner) - 1)

Init ==
  (*************************************************************************)
  (* The initial predicate.                                                *)
  (*************************************************************************)
  /\ switchAUp \in BOOLEAN
  /\ switchBUp \in BOOLEAN
  /\ timesSwitched = [i \in OtherPrisoner |-> 0]
  /\ count     = 0

Done == 
  (*************************************************************************)
  (* This is the condition that tells the counter that every other         *)
  (* prisoner has been in the room at least once.  (He will trivially know *)
  (* that he's already been in the room when this condition is true.)      *)
  (*************************************************************************)
  count = 2 * (Cardinality(Prisoner) - 1)
-----------------------------------------------------------------------------
(***************************************************************************)
(* Next come the actions performed by each prisoner when he (or she) is    *)
(* brought into the room with the switches.                                *)
(***************************************************************************)
NonCounterStep(i) ==
  (*************************************************************************)
  (* A prisoner other than the counter moves switch A up if it is down and *)
  (* if (s)he has not already moved it up two times.  Otherwise, (s)he     *)
  (* flips switch B.                                                       *)
  (*************************************************************************)
  /\ IF (~switchAUp) /\ (timesSwitched[i] < 2)
       THEN /\ switchAUp' = TRUE
            /\ timesSwitched' = [timesSwitched EXCEPT ![i] = @+1]
            /\ UNCHANGED switchBUp
       ELSE /\ switchBUp' = ~switchBUp
            /\ UNCHANGED <<switchAUp, timesSwitched>>
  /\ UNCHANGED count
       
CounterStep ==
  (*************************************************************************)
  (* If switch A is up, the counter moves it down and increments his (or   *)
  (* her) count.  Otherwise, (s)he flips switch B.                         *)
  (*************************************************************************)
  /\ IF switchAUp
       THEN /\ switchAUp' = FALSE
            /\ UNCHANGED switchBUp
            /\ count' =  count + 1
       ELSE /\ switchBUp' = ~switchBUp
            /\ UNCHANGED <<switchAUp, count>>
  /\ UNCHANGED timesSwitched

Next == 
  (*************************************************************************)
  (* The next-state relation                                               *)
  (*************************************************************************)
  \/ CounterStep 
  \/ \E i \in OtherPrisoner : NonCounterStep(i)

Fairness == 
  (*************************************************************************)
  (* This asserts that every prisoner is brought into the room infinitely  *)
  (* often.                                                                *)
  (*************************************************************************)
  /\ WF_vars(CounterStep)
  /\ \A i \in OtherPrisoner : WF_vars(NonCounterStep(i))

Spec == Init /\ [][Next]_vars /\ Fairness
-----------------------------------------------------------------------------
Safety == 
  (*************************************************************************)
  (* This formula asserts that safety condition: that Done true implies    *)
  (* that every prisoner other than the counter has flipped switch A at    *)
  (* least once--and hence has been in the room at least once.  Since the  *)
  (* counter increments the count only when in the room, and Done implies  *)
  (* count > 0, it also implies that the counter has been in the room.     *)
  (*************************************************************************)
  [](Done => (\A i \in Prisoner \ {Counter} : timesSwitched[i] > 0))

Liveness == <>Done
  (*************************************************************************)
  (* This asserts that Done is eventually true, so the prisoners are       *)
  (* eventually released.                                                  *)
  (*************************************************************************)
  
THEOREM Spec => Safety /\ Liveness
  (*************************************************************************)
  (* This theorem asserts that the specification satisfies properties      *)
  (* Safety and Liveness.  TLC verifies this in a few seconds for the case *)
  (* of a half dozen prisoners.  It also quickly provides a counterexample *)
  (* if Done is changed to assert a smaller value of count.                *)
  (*************************************************************************)

CountInvariant ==
  (*************************************************************************)
  (* This is an invariant of Spec.  From its invariance, one can easily    *)
  (* prove that Spec satisfies its safety property.                        *)
  (*************************************************************************)
  LET totalSwitched ==
        (*******************************************************************)
        (* A recursive definition of the sum, over all p in OtherPrisoner, *)
        (* of timesSwitched[p].                                            *)
        (*******************************************************************)
        LET sum[S \in SUBSET OtherPrisoner] ==
              IF S = {} THEN 0
                        ELSE LET p == CHOOSE pr \in S : TRUE
                             IN  timesSwitched[p] + sum[S \ {p}]
        IN  sum[OtherPrisoner]
      oneIfUp == IF switchAUp THEN 1 ELSE 0
        (*******************************************************************)
        (* Equals 1 if switch A is up, 0 otherwise.                        *)
        (*******************************************************************)
  IN  count \in {totalSwitched - oneIfUp, totalSwitched - oneIfUp + 1}
CountInfOftenZero == []<>(count = 0)

-------
CONSTANT p1, p2, p3, p4
PostCondition ==
CounterExample =
[ action |->
      { << << 1,
              [ switchAUp |-> TRUE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 0 @@ p3 :> 0 @@ p4 :> 0),
                count |-> 0 ] >>,
           [ name |-> "CounterStep",
             location |->
                 [ beginLine |-> 137,
                   beginColumn |-> 3,
                   endLine |-> 143,
                   endColumn |-> 28,
                   module |-> "Prisoners" ] ],
           << 2,
              [ switchAUp |-> FALSE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 0 @@ p3 :> 0 @@ p4 :> 0),
                count |-> 1 ] >> >>,
        << << 2,
              [ switchAUp |-> FALSE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 0 @@ p3 :> 0 @@ p4 :> 0),
                count |-> 1 ] >>,
           [ name |-> "NonCounterStep",
             location |->
                 [ beginLine |-> 124,
                   beginColumn |-> 3,
                   endLine |-> 130,
                   endColumn |-> 20,
                   module |-> "Prisoners" ],
             context |-> [i |-> p4],
             parameters |-> <<"i">> ],
           << 3,
              [ switchAUp |-> TRUE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 0 @@ p3 :> 0 @@ p4 :> 1),
                count |-> 1 ] >> >>,
        << << 3,
              [ switchAUp |-> TRUE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 0 @@ p3 :> 0 @@ p4 :> 1),
                count |-> 1 ] >>,
           [ name |-> "CounterStep",
             location |->
                 [ beginLine |-> 137,
                   beginColumn |-> 3,
                   endLine |-> 143,
                   endColumn |-> 28,
                   module |-> "Prisoners" ] ],
           << 4,
              [ switchAUp |-> FALSE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 0 @@ p3 :> 0 @@ p4 :> 1),
                count |-> 2 ] >> >>,
        << << 4,
              [ switchAUp |-> FALSE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 0 @@ p3 :> 0 @@ p4 :> 1),
                count |-> 2 ] >>,
           [ name |-> "NonCounterStep",
             location |->
                 [ beginLine |-> 124,
                   beginColumn |-> 3,
                   endLine |-> 130,
                   endColumn |-> 20,
                   module |-> "Prisoners" ],
             context |-> [i |-> p2],
             parameters |-> <<"i">> ],
           << 5,
              [ switchAUp |-> TRUE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 1 @@ p3 :> 0 @@ p4 :> 1),
                count |-> 2 ] >> >>,
        << << 5,
              [ switchAUp |-> TRUE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 1 @@ p3 :> 0 @@ p4 :> 1),
                count |-> 2 ] >>,
           [ name |-> "CounterStep",
             location |->
                 [ beginLine |-> 137,
                   beginColumn |-> 3,
                   endLine |-> 143,
                   endColumn |-> 28,
                   module |-> "Prisoners" ] ],
           << 6,
              [ switchAUp |-> FALSE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 1 @@ p3 :> 0 @@ p4 :> 1),
                count |-> 3 ] >> >>,
        << << 6,
              [ switchAUp |-> FALSE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 1 @@ p3 :> 0 @@ p4 :> 1),
                count |-> 3 ] >>,
           [ name |-> "NonCounterStep",
             location |->
                 [ beginLine |-> 124,
                   beginColumn |-> 3,
                   endLine |-> 130,
                   endColumn |-> 20,
                   module |-> "Prisoners" ],
             context |-> [i |-> p3],
             parameters |-> <<"i">> ],
           << 7,
              [ switchAUp |-> TRUE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 1 @@ p3 :> 1 @@ p4 :> 1),
                count |-> 3 ] >> >>,
        << << 7,
              [ switchAUp |-> TRUE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 1 @@ p3 :> 1 @@ p4 :> 1),
                count |-> 3 ] >>,
           [ name |-> "CounterStep",
             location |->
                 [ beginLine |-> 137,
                   beginColumn |-> 3,
                   endLine |-> 143,
                   endColumn |-> 28,
                   module |-> "Prisoners" ] ],
           << 8,
              [ switchAUp |-> FALSE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 1 @@ p3 :> 1 @@ p4 :> 1),
                count |-> 4 ] >> >>,
        << << 8,
              [ switchAUp |-> FALSE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 1 @@ p3 :> 1 @@ p4 :> 1),
                count |-> 4 ] >>,
           [ name |-> "NonCounterStep",
             location |->
                 [ beginLine |-> 124,
                   beginColumn |-> 3,
                   endLine |-> 130,
                   endColumn |-> 20,
                   module |-> "Prisoners" ],
             context |-> [i |-> p3],
             parameters |-> <<"i">> ],
           << 9,
              [ switchAUp |-> TRUE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 1 @@ p3 :> 2 @@ p4 :> 1),
                count |-> 4 ] >> >>,
        << << 9,
              [ switchAUp |-> TRUE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 1 @@ p3 :> 2 @@ p4 :> 1),
                count |-> 4 ] >>,
           [ name |-> "CounterStep",
             location |->
                 [ beginLine |-> 137,
                   beginColumn |-> 3,
                   endLine |-> 143,
                   endColumn |-> 28,
                   module |-> "Prisoners" ] ],
           << 10,
              [ switchAUp |-> FALSE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 1 @@ p3 :> 2 @@ p4 :> 1),
                count |-> 5 ] >> >>,
        << << 10,
              [ switchAUp |-> FALSE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 1 @@ p3 :> 2 @@ p4 :> 1),
                count |-> 5 ] >>,
           [ name |-> "NonCounterStep",
             location |->
                 [ beginLine |-> 124,
                   beginColumn |-> 3,
                   endLine |-> 130,
                   endColumn |-> 20,
                   module |-> "Prisoners" ],
             context |-> [i |-> p4],
             parameters |-> <<"i">> ],
           << 11,
              [ switchAUp |-> TRUE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 1 @@ p3 :> 2 @@ p4 :> 2),
                count |-> 5 ] >> >>,
        << << 11,
              [ switchAUp |-> TRUE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 1 @@ p3 :> 2 @@ p4 :> 2),
                count |-> 5 ] >>,
           [ name |-> "CounterStep",
             location |->
                 [ beginLine |-> 137,
                   beginColumn |-> 3,
                   endLine |-> 143,
                   endColumn |-> 28,
                   module |-> "Prisoners" ] ],
           << 12,
              [ switchAUp |-> FALSE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 1 @@ p3 :> 2 @@ p4 :> 2),
                count |-> 6 ] >> >>,
        << << 12,
              [ switchAUp |-> FALSE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 1 @@ p3 :> 2 @@ p4 :> 2),
                count |-> 6 ] >>,
           [ name |-> "NonCounterStep",
             location |->
                 [ beginLine |-> 124,
                   beginColumn |-> 3,
                   endLine |-> 130,
                   endColumn |-> 20,
                   module |-> "Prisoners" ],
             context |-> [i |-> p2],
             parameters |-> <<"i">> ],
           << 13,
              [ switchAUp |-> TRUE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 2 @@ p3 :> 2 @@ p4 :> 2),
                count |-> 6 ] >> >>,
        << << 13,
              [ switchAUp |-> TRUE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 2 @@ p3 :> 2 @@ p4 :> 2),
                count |-> 6 ] >>,
           [ name |-> "CounterStep",
             location |->
                 [ beginLine |-> 137,
                   beginColumn |-> 3,
                   endLine |-> 143,
                   endColumn |-> 28,
                   module |-> "Prisoners" ] ],
           << 14,
              [ switchAUp |-> FALSE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 2 @@ p3 :> 2 @@ p4 :> 2),
                count |-> 7 ] >> >>,
        << << 14,
              [ switchAUp |-> FALSE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 2 @@ p3 :> 2 @@ p4 :> 2),
                count |-> 7 ] >>,
           [ name |-> "CounterStep",
             location |->
                 [ beginLine |-> 137,
                   beginColumn |-> 3,
                   endLine |-> 143,
                   endColumn |-> 28,
                   module |-> "Prisoners" ] ],
           << 15,
              [ switchAUp |-> FALSE,
                switchBUp |-> TRUE,
                timesSwitched |-> (p2 :> 2 @@ p3 :> 2 @@ p4 :> 2),
                count |-> 7 ] >> >>,
        << << 15,
              [ switchAUp |-> FALSE,
                switchBUp |-> TRUE,
                timesSwitched |-> (p2 :> 2 @@ p3 :> 2 @@ p4 :> 2),
                count |-> 7 ] >>,
           [ name |-> "CounterStep",
             location |->
                 [ beginLine |-> 137,
                   beginColumn |-> 3,
                   endLine |-> 143,
                   endColumn |-> 28,
                   module |-> "Prisoners" ] ],
           << 14,
              [ switchAUp |-> FALSE,
                switchBUp |-> FALSE,
                timesSwitched |-> (p2 :> 2 @@ p3 :> 2 @@ p4 :> 2),
                count |-> 7 ] >> >> },
  state |->
      { << 1,
           [ switchAUp |-> TRUE,
             switchBUp |-> FALSE,
             timesSwitched |-> (p2 :> 0 @@ p3 :> 0 @@ p4 :> 0),
             count |-> 0 ] >>,
        << 2,
           [ switchAUp |-> FALSE,
             switchBUp |-> FALSE,
             timesSwitched |-> (p2 :> 0 @@ p3 :> 0 @@ p4 :> 0),
             count |-> 1 ] >>,
        << 3,
           [ switchAUp |-> TRUE,
             switchBUp |-> FALSE,
             timesSwitched |-> (p2 :> 0 @@ p3 :> 0 @@ p4 :> 1),
             count |-> 1 ] >>,
        << 4,
           [ switchAUp |-> FALSE,
             switchBUp |-> FALSE,
             timesSwitched |-> (p2 :> 0 @@ p3 :> 0 @@ p4 :> 1),
             count |-> 2 ] >>,
        << 5,
           [ switchAUp |-> TRUE,
             switchBUp |-> FALSE,
             timesSwitched |-> (p2 :> 1 @@ p3 :> 0 @@ p4 :> 1),
             count |-> 2 ] >>,
        << 6,
           [ switchAUp |-> FALSE,
             switchBUp |-> FALSE,
             timesSwitched |-> (p2 :> 1 @@ p3 :> 0 @@ p4 :> 1),
             count |-> 3 ] >>,
        << 7,
           [ switchAUp |-> TRUE,
             switchBUp |-> FALSE,
             timesSwitched |-> (p2 :> 1 @@ p3 :> 1 @@ p4 :> 1),
             count |-> 3 ] >>,
        << 8,
           [ switchAUp |-> FALSE,
             switchBUp |-> FALSE,
             timesSwitched |-> (p2 :> 1 @@ p3 :> 1 @@ p4 :> 1),
             count |-> 4 ] >>,
        << 9,
           [ switchAUp |-> TRUE,
             switchBUp |-> FALSE,
             timesSwitched |-> (p2 :> 1 @@ p3 :> 2 @@ p4 :> 1),
             count |-> 4 ] >>,
        << 10,
           [ switchAUp |-> FALSE,
             switchBUp |-> FALSE,
             timesSwitched |-> (p2 :> 1 @@ p3 :> 2 @@ p4 :> 1),
             count |-> 5 ] >>,
        << 11,
           [ switchAUp |-> TRUE,
             switchBUp |-> FALSE,
             timesSwitched |-> (p2 :> 1 @@ p3 :> 2 @@ p4 :> 2),
             count |-> 5 ] >>,
        << 12,
           [ switchAUp |-> FALSE,
             switchBUp |-> FALSE,
             timesSwitched |-> (p2 :> 1 @@ p3 :> 2 @@ p4 :> 2),
             count |-> 6 ] >>,
        << 13,
           [ switchAUp |-> TRUE,
             switchBUp |-> FALSE,
             timesSwitched |-> (p2 :> 2 @@ p3 :> 2 @@ p4 :> 2),
             count |-> 6 ] >>,
        << 14,
           [ switchAUp |-> FALSE,
             switchBUp |-> FALSE,
             timesSwitched |-> (p2 :> 2 @@ p3 :> 2 @@ p4 :> 2),
             count |-> 7 ] >>,
        << 15,
           [ switchAUp |-> FALSE,
             switchBUp |-> TRUE,
             timesSwitched |-> (p2 :> 2 @@ p3 :> 2 @@ p4 :> 2),
             count |-> 7 ] >> } ]
=============================================================================

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 2 branches.
    2269:0 Computed 2 initial states...
    2190:0 Finished computing initial states: 4 distinct states generated at <date>.
    2192:0 Checking 2 branches of temporal properties for the complete state space with 428 total distinct states at (<date>)
    2116:1 Temporal property CountInfOftenZero was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    /\ timesSwitched = (p2 :> 0 @@ p3 :> 0 @@ p4 :> 0)
    /\ switchAUp = TRUE
    /\ switchBUp = FALSE
    /\ count = 0
    2217:4 2: <CounterStep line 159, col 3 to line 165, col 28 of module Prisoners>
    /\ timesSwitched = (p2 :> 0 @@ p3 :> 0 @@ p4 :> 0)
    /\ switchAUp = FALSE
    /\ switchBUp = FALSE
    /\ count = 1
    2217:4 3: <NonCounterStep(p4) line 146, col 3 to line 152, col 20 of module Prisoners>
    /\ timesSwitched = (p2 :> 0 @@ p3 :> 0 @@ p4 :> 1)
    /\ switchAUp = TRUE
    /\ switchBUp = FALSE
    /\ count = 1
    2217:4 4: <CounterStep line 159, col 3 to line 165, col 28 of module Prisoners>
    /\ timesSwitched = (p2 :> 0 @@ p3 :> 0 @@ p4 :> 1)
    /\ switchAUp = FALSE
    /\ switchBUp = FALSE
    /\ count = 2
    2217:4 5: <NonCounterStep(p2) line 146, col 3 to line 152, col 20 of module Prisoners>
    /\ timesSwitched = (p2 :> 1 @@ p3 :> 0 @@ p4 :> 1)
    /\ switchAUp = TRUE
    /\ switchBUp = FALSE
    /\ count = 2
    2217:4 6: <CounterStep line 159, col 3 to line 165, col 28 of module Prisoners>
    /\ timesSwitched = (p2 :> 1 @@ p3 :> 0 @@ p4 :> 1)
    /\ switchAUp = FALSE
    /\ switchBUp = FALSE
    /\ count = 3
    2217:4 7: <NonCounterStep(p3) line 146, col 3 to line 152, col 20 of module Prisoners>
    /\ timesSwitched = (p2 :> 1 @@ p3 :> 1 @@ p4 :> 1)
    /\ switchAUp = TRUE
    /\ switchBUp = FALSE
    /\ count = 3
    2217:4 8: <CounterStep line 159, col 3 to line 165, col 28 of module Prisoners>
    /\ timesSwitched = (p2 :> 1 @@ p3 :> 1 @@ p4 :> 1)
    /\ switchAUp = FALSE
    /\ switchBUp = FALSE
    /\ count = 4
    2217:4 9: <NonCounterStep(p3) line 146, col 3 to line 152, col 20 of module Prisoners>
    /\ timesSwitched = (p2 :> 1 @@ p3 :> 2 @@ p4 :> 1)
    /\ switchAUp = TRUE
    /\ switchBUp = FALSE
    /\ count = 4
    2217:4 10: <CounterStep line 159, col 3 to line 165, col 28 of module Prisoners>
    /\ timesSwitched = (p2 :> 1 @@ p3 :> 2 @@ p4 :> 1)
    /\ switchAUp = FALSE
    /\ switchBUp = FALSE
    /\ count = 5
    2217:4 11: <NonCounterStep(p4) line 146, col 3 to line 152, col 20 of module Prisoners>
    /\ timesSwitched = (p2 :> 1 @@ p3 :> 2 @@ p4 :> 2)
    /\ switchAUp = TRUE
    /\ switchBUp = FALSE
    /\ count = 5
    2217:4 12: <CounterStep line 159, col 3 to line 165, col 28 of module Prisoners>
    /\ timesSwitched = (p2 :> 1 @@ p3 :> 2 @@ p4 :> 2)
    /\ switchAUp = FALSE
    /\ switchBUp = FALSE
    /\ count = 6
    2217:4 13: <NonCounterStep(p2) line 146, col 3 to line 152, col 20 of module Prisoners>
    /\ timesSwitched = (p2 :> 2 @@ p3 :> 2 @@ p4 :> 2)
    /\ switchAUp = TRUE
    /\ switchBUp = FALSE
    /\ count = 6
    2217:4 14: <CounterStep line 159, col 3 to line 165, col 28 of module Prisoners>
    /\ timesSwitched = (p2 :> 2 @@ p3 :> 2 @@ p4 :> 2)
    /\ switchAUp = FALSE
    /\ switchBUp = FALSE
    /\ count = 7
    2217:4 15: <CounterStep line 159, col 3 to line 165, col 28 of module Prisoners>
    /\ timesSwitched = (p2 :> 2 @@ p3 :> 2 @@ p4 :> 2)
    /\ switchAUp = FALSE
    /\ switchBUp = TRUE
    /\ count = 7
    2122:4 14: Back to state: <CounterStep line 159, col 3 to line 165, col 28 of module Prisoners>
    2404:1 Postcondition PostCondition at line 233, col 1 to line 577, col 33 of module Prisoners is false.
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 860 states generated, 214 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 14.
---*)
