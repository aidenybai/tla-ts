(*---
description: Ported from TLC's InvParameterizedATest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/InvParameterizedATest.java
features:
  - tlc-regression
outcome: safety-violation
args:
  - -config
  - InvParameterizedTest.tla
  - -invlevel
  - "4"
  - -deadlock
---*)
This is a duplicate of DieHardTLA.tla that doesn't EXTEND TLC to test that this dependency is dynamically added.
----------------------- MODULE InvParameterizedTest ------------------------
EXTENDS Integers

VARIABLES small, big   
          
TypeOK == /\ small \in 0..3 
          /\ big   \in 0..5

Init == /\ big   = 0 
        /\ small = 0

FillSmall == /\ small' = 3 
             /\ big'   = big

FillBig == /\ big'   = 5 
           /\ small' = small

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

=============================================================================
----------------------- CONFIG InvParameterizedTest -------------------------
SPECIFICATION Spec
=============================================================================

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant __DebuggerExpr__<id> is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ big = 0
    /\ small = 0
    2217:4 2: <FillSmall line 26, col 14 to line 27, col 28 of module InvParameterizedTest>
    /\ big = 0
    /\ small = 3
    2217:4 3: <SmallToBig line 38, col 15 to line 42, col 49 of module InvParameterizedTest>
    /\ big = 3
    /\ small = 0
    2217:4 4: <FillSmall line 26, col 14 to line 27, col 28 of module InvParameterizedTest>
    /\ big = 3
    /\ small = 3
    2199:0 26 states generated, 7 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 4.
---*)
