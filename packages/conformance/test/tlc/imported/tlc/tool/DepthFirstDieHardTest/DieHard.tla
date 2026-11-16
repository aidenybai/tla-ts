(*---
description: Ported from TLC's DepthFirstDieHardTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/DepthFirstDieHardTest.java
features:
  - tlc-regression
outcome: safety-violation
config: |-
  SPECIFICATION
  Spec
  INVARIANT
  Inv
args:
  - -dfid
  - "7"
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
    2208:0 Finished computing initial states: 1 states generated, with 1 of them distinct.
    2205:0 Starting level 2: 1 states generated, 1 distinct states found.
    2205:0 Starting level 3: 7 states generated, 7 distinct states found.
    2205:0 Starting level 4: 49 states generated, 15 distinct states found.
    2205:0 Starting level 5: 139 states generated, 29 distinct states found.
    2205:0 Starting level 6: 313 states generated, 41 distinct states found.
    2205:0 Starting level 7: 559 states generated, 53 distinct states found.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: 
    /\ action = "nondet"
    /\ smallBucket = 0
    /\ bigBucket = 0
    /\ water_to_pour = 0
    2217:4 2: 
    /\ action = "fill big"
    /\ smallBucket = 0
    /\ bigBucket = 5
    /\ water_to_pour = 0
    2217:4 3: 
    /\ action = "pour big to small"
    /\ smallBucket = 3
    /\ bigBucket = 2
    /\ water_to_pour = 3
    2217:4 4: 
    /\ action = "empty small"
    /\ smallBucket = 0
    /\ bigBucket = 2
    /\ water_to_pour = 3
    2217:4 5: 
    /\ action = "pour big to small"
    /\ smallBucket = 2
    /\ bigBucket = 0
    /\ water_to_pour = 2
    2217:4 6: 
    /\ action = "fill big"
    /\ smallBucket = 2
    /\ bigBucket = 5
    /\ water_to_pour = 2
    2217:4 7: 
    /\ action = "pour big to small"
    /\ smallBucket = 3
    /\ bigBucket = 4
    /\ water_to_pour = 1
    2206:0 Progress(-1) at <date>: 876 states generated, 68 distinct states found, -1 states left on queue.
    2204:0 876 states generated, 68 distinct states found.
---*)
