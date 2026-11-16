(*---
description: Ported from TLC's MinimalSetOfNextStatesTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/MinimalSetOfNextStatesTest.java
features:
  - tlc-regression
outcome: success
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
  _POSSIBLE HasFive LeaveInit
  POSTCONDITION PossibleCounts
args:
  - -deadlock
---*)
--------- MODULE MinimalSetOfNextStates ------------
EXTENDS TLC
VARIABLE x

Init == x = 42


\* x = 0 true because _second_ conjunct is true.
\* The allAssigned branch in Tool#getInitStates(ActionItemList, TLCState, IStateFunctor)
\* prevents TLC from generating duplicate states with x = 0.  
N1a == /\ x' = 0
       /\ \/ 1 = 1
          \/ 2 = 2
          \/ 3 = 3
         
\* x = 1 true because _first_ conjunct is true.
\* The allAssigned branch in Tool#getInitStates(ActionItemList, TLCState, IStateFunctor)
\* _does not_ prevents TLC from generating duplicate states with x = 1.
N1b == /\ \/ 1 = 1
          \/ 2 = 2
          \/ 3 = 3
       /\ x' = 1

\* x = 2 true because _first_ conjunct is true.
\* The allAssigned branch in Tool#getInitStates(ActionItemList, TLCState, IStateFunctor)
\* _does not_ prevents TLC from generating three states with x = 2. The "~~" trick prevents
\* TLC from generating duplicate states with x = 2 because Tool simply evaluates the first
\* conjunct without generating states.
N1c == /\ ~~(\/ 1 = 1
             \/ 2 = 2
             \/ 3 = 3)
       /\ x' = 2
       
N2 == /\ x' = 3 \* Pred FALSE
      /\ \/ 1 = 2
         \/ 2 = 3
         \/ 3 = 1

N3 == /\ \/ 1 = 2 \* Pred FALSE
         \/ 2 = 3
         \/ 3 = 1
      /\ x' = 4

N4 == \/ x' = 5
      \/ x' = 6
        /\ \/ \/ 1 = 2
              \/ 1 = 1 
           \/ 2 = 3
           \/ 3 = 2

N5 == /\ x' = 7

Next == \/ N1a
        \/ N1b
        \/ N1c
        \/ N2
        \/ N3
        \/ N4
        \/ N5
           
Inv == x \in {42,0,1,2,5,6,7}

HasFive == x = 5

LeaveInit == x = 42 /\ x' # 42

PossibleCounts ==
    LET p == TLCGet("all:named")["s:_possible"][1]
    IN /\ p["HasFive"] = 7
       /\ p["LeaveInit"] = 8
====================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.9E-17
    2199:0 57 states generated, 7 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 6 and the 95th percentile is 6).
---*)
