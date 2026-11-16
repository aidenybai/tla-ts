(*---
description: Ported from TLC's RandomSubsetNextT4Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/RandomSubsetNextT4Test.java
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
------------------------- MODULE RandomSubsetNext -------------------------
EXTENDS Integers, Randomization

VARIABLE x, y

Init == /\ x \in RandomSubset(10, 1..1000)
        /\ y = 0

Product == (1..200) \X (1..200) \X (1..200)

Next == /\ x'\in RandomSubset(10, 1..1000)
        /\ y' = y + 1
        /\ RandomSubset(10, Product) \subseteq Product
        
Spec == Init /\ [][Next]_<<x,y>>

Inv == y < 10
=============================================================================

(*--- recorded
all:
  exit: 12
  transcript: |-
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2269:0 Computed 8 initial states...
    2190:0 Finished computing initial states: 10 distinct states generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 21
    /\ y = 0
    2217:4 2: <Next line 25, col 9 to line 27, col 54 of module RandomSubsetNext>
    /\ x = 109
    /\ y = 1
    2217:4 3: <Next line 25, col 9 to line 27, col 54 of module RandomSubsetNext>
    /\ x = 126
    /\ y = 2
    2217:4 4: <Next line 25, col 9 to line 27, col 54 of module RandomSubsetNext>
    /\ x = 68
    /\ y = 3
    2217:4 5: <Next line 25, col 9 to line 27, col 54 of module RandomSubsetNext>
    /\ x = 56
    /\ y = 4
    2217:4 6: <Next line 25, col 9 to line 27, col 54 of module RandomSubsetNext>
    /\ x = 173
    /\ y = 5
    2217:4 7: <Next line 25, col 9 to line 27, col 54 of module RandomSubsetNext>
    /\ x = 5
    /\ y = 6
    2217:4 8: <Next line 25, col 9 to line 27, col 54 of module RandomSubsetNext>
    /\ x = 45
    /\ y = 7
    2217:4 9: <Next line 25, col 9 to line 27, col 54 of module RandomSubsetNext>
    /\ x = 61
    /\ y = 8
    2217:4 10: <Next line 25, col 9 to line 27, col 54 of module RandomSubsetNext>
    /\ x = 131
    /\ y = 9
    2217:4 11: <Next line 25, col 9 to line 27, col 54 of module RandomSubsetNext>
    /\ x = 34
    /\ y = 10
    2199:0 66781 states generated, 7678 distinct states found, 999 states left on queue.
    2194:0 The depth of the complete state graph search is 11.
---*)
