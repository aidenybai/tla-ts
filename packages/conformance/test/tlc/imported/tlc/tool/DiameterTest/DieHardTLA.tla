(*---
description: Ported from TLC's DiameterTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/DiameterTest.java
features:
  - tlc-regression
outcome: success
config: |-
  SPECIFICATION
  Spec
  INVARIANT
  TypeOK
  _POSSIBLE HasFour PourAction
  POSTCONDITION PossibleCounts
args:
  - -deadlock
---*)
------------------------------ MODULE DieHardTLA ------------------------------
EXTENDS Integers, TLC, _Possible

VARIABLES small, big   
          
TypeOK == /\ small \in 0..3 
          /\ big   \in 0..5

Init == /\ big   = 0 
        /\ small = 0
        /\ TLCSet(42, 0)


FillSmall == /\ small' = 3 
             /\ big'   = big
             /\ TLCSet(42, TLCGet(42) + 3)

FillBig == /\ big'   = 5 
           /\ small' = small
             /\ TLCSet(42, TLCGet(42) + 5)

EmptySmall == /\ small' = 0 
              /\ big'   = big

EmptyBig == /\ big'   = 0 
            /\ small' = small

SmallToBig == IF big + small =< 5
               THEN /\ big'   = big + small
                    /\ small' = 0
               ELSE /\ big'   = 5
                    /\ small' = small - (5 - big)
 
BigToSmall == IF big + small =< 3
               THEN /\ big'   = 0 
                    /\ small' = big + small
               ELSE /\ big'   = small - (3 - big)
                    /\ small' = 3

Next == \/ FillSmall 
        \/ FillBig    
        \/ EmptySmall 
        \/ EmptyBig    
        \/ SmallToBig    
        \/ BigToSmall    
        
Spec == Init /\ [][Next]_<<small, big>>   


HasFour == big = 4

PourAction == small' # small /\ big' # big

PossibleCounts ==
    LET p == _Counts
    IN /\ p["HasFour"] = 8
       /\ p["PourAction"] = 14

PostCondition ==
  \* Evaluating the spec takes 97 states of which 16 are distinct.  The
  \* diameter of the spec is 8.
  /\ TLCGet("generated") = 97
  /\ TLCGet("distinct") = 16
  /\ TLCGet("diameter") = 8
  \* Total gallons of water used by TLC to check the spec is 128. Not sure
  \* if this is considered an acceptable ecological footprint. 
  /\ \/ TLCGet(42) = 128
     \/ Print(TLCGet(42), FALSE)
  \* On average, for each distinct state of the spec, TLC pours 8 gallons
  \* of water from the fountain. To check if TLC correctly reports the 
  \* violating of this property, we expect it to be 23.
  /\ \/ (TLCGet(42) \div TLCGet("distinct")) = 23
     \/ Print(TLCGet(42) \div TLCGet("distinct"), FALSE)

=============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 7.0E-17
    2199:0 97 states generated, 16 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 8.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 2 and the 95th percentile is 2).
---*)
