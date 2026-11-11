(*---
description: Ported from TLC's CheckpointOnViolationTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/checkpoint/CheckpointOnViolationTest.java
features:
  - tlc-regression
outcome: safety-violation
config: |-
  SPECIFICATION
  Spec
  INVARIANT
  Inv
args:
  - -deadlock
---*)
---------------------------- MODULE DieHard ----------------------------
EXTENDS TLC, Integers

Min(m, n) == IF m < n THEN m ELSE n

NONDET == "nondet"
FILL_BIG == "fill big"
EMPTY_BIG == "empty big"
FILL_SMALL == "fill small"
EMPTY_SMALL == "empty small"
BIG_TO_SMALL == "pour big to small"
SMALL_TO_BIG == "pour small to big"

(***************************************************************************
--algorithm DieHardDemo {
    variables bigBucket = 0, smallBucket = 0, action = NONDET;
      
    process (FixWater = 1)
      variables water_to_pour = 0;
      {
        LB1: while (TRUE) 
          {
            either { action := FILL_BIG; bigBucket := 5; }
                or { action := EMPTY_BIG; bigBucket := 0; }
                or { action := FILL_SMALL; smallBucket := 3; } 
                or { action := EMPTY_SMALL; smallBucket := 0; } 
                or { 
                     action := BIG_TO_SMALL; 
                     water_to_pour := Min(3 - smallBucket, bigBucket); 
                     smallBucket := smallBucket + water_to_pour;
                     bigBucket := bigBucket - water_to_pour;
                   }
                or { 
                     action := SMALL_TO_BIG; 
                     water_to_pour := Min(5 - bigBucket, smallBucket); 
                     smallBucket := smallBucket - water_to_pour;
                     bigBucket := bigBucket + water_to_pour;
                   }
          }
      }
}

***************************************************************************)
\* BEGIN TRANSLATION
VARIABLES bigBucket, smallBucket, action, water_to_pour

vars == << bigBucket, smallBucket, action, water_to_pour >>

ProcSet == {1}

Init == (* Global variables *)
        /\ bigBucket = 0
        /\ smallBucket = 0
        /\ action = NONDET
        (* Process FixWater *)
        /\ water_to_pour = 0

FixWater == \/ /\ action' = FILL_BIG
               /\ bigBucket' = 5
               /\ UNCHANGED <<smallBucket, water_to_pour>>
            \/ /\ action' = EMPTY_BIG
               /\ bigBucket' = 0
               /\ UNCHANGED <<smallBucket, water_to_pour>>
            \/ /\ action' = FILL_SMALL
               /\ smallBucket' = 3
               /\ UNCHANGED <<bigBucket, water_to_pour>>
            \/ /\ action' = EMPTY_SMALL
               /\ smallBucket' = 0
               /\ UNCHANGED <<bigBucket, water_to_pour>>
            \/ /\ action' = BIG_TO_SMALL
               /\ water_to_pour' = Min(3 - smallBucket, bigBucket)
               /\ smallBucket' = smallBucket + water_to_pour'
               /\ bigBucket' = bigBucket - water_to_pour'
            \/ /\ action' = SMALL_TO_BIG
               /\ water_to_pour' = Min(5 - bigBucket, smallBucket)
               /\ smallBucket' = smallBucket - water_to_pour'
               /\ bigBucket' = bigBucket + water_to_pour'

Next == FixWater

Spec == Init /\ [][Next]_vars

Inv == bigBucket # 4

\* END TRANSLATION

=============================================================================

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ action = "nondet"
    /\ smallBucket = 0
    /\ bigBucket = 0
    /\ water_to_pour = 0
    2217:4 2: <FixWater line 72, col 16 to line 74, col 58 of module DieHard>
    /\ action = "fill big"
    /\ smallBucket = 0
    /\ bigBucket = 5
    /\ water_to_pour = 0
    2217:4 3: <FixWater line 84, col 16 to line 87, col 57 of module DieHard>
    /\ action = "pour big to small"
    /\ smallBucket = 3
    /\ bigBucket = 2
    /\ water_to_pour = 3
    2217:4 4: <FixWater line 81, col 16 to line 83, col 56 of module DieHard>
    /\ action = "empty small"
    /\ smallBucket = 0
    /\ bigBucket = 2
    /\ water_to_pour = 3
    2217:4 5: <FixWater line 84, col 16 to line 87, col 57 of module DieHard>
    /\ action = "pour big to small"
    /\ smallBucket = 2
    /\ bigBucket = 0
    /\ water_to_pour = 2
    2217:4 6: <FixWater line 72, col 16 to line 74, col 58 of module DieHard>
    /\ action = "fill big"
    /\ smallBucket = 2
    /\ bigBucket = 5
    /\ water_to_pour = 2
    2217:4 7: <FixWater line 84, col 16 to line 87, col 57 of module DieHard>
    /\ action = "pour big to small"
    /\ smallBucket = 3
    /\ bigBucket = 4
    /\ water_to_pour = 1
    2199:0 252 states generated, 54 distinct states found, 11 states left on queue.
    2194:0 The depth of the complete state graph search is 7.
---*)
