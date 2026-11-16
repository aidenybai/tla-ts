(*---
description: Ported from TLC's RandomSubsetNextTuplesTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/RandomSubsetNextTuplesTest.java
features:
  - tlc-regression
outcome: safety-violation
config: |
  SPECIFICATION
  Spec
  INVARIANT
  Inv
  TypeOK
args:
  - -deadlock
---*)
---------------------- MODULE RandomSubsetNextTuples ----------------------
EXTENDS Integers, Randomization

VARIABLE p, q, y

\* Not two more variables of RandomSubsetNext.tla, where a freshly drawn tuple
\* all but never repeats an earlier one, so nothing bounds a level the way
\* x \in 1..1000 does and its ten successors per state put 10^9 states below
\* y = 10.

\* Product has fewer elements than an int holds and BigProduct more.
Product == (1..200) \X (1..200) \X (1..200)
BigProduct == (1..4000) \X (1..4000) \X (1..4000)

Init == /\ p \in RandomSubset(2, Product)
        /\ q \in RandomSubset(2, BigProduct)
        /\ y = 0

Next == /\ p' \in RandomSubset(2, Product)
        /\ q' \in RandomSubset(2, BigProduct)
        /\ y' = y + 1

Spec == Init /\ [][Next]_<<p,q,y>>

\* Four successors per state, i.e. 4^y states of level y.
Inv == y < 6

TypeOK == /\ y \in Nat
          /\ p \in Product
          /\ q \in BigProduct
=============================================================================

(*--- recorded
all:
  exit: 12
  transcript: |-
    2269:0 Computed 2 initial states...
    2190:0 Finished computing initial states: 4 distinct states generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ p = <<57, 130, 186>>
    /\ q = <<1931, 2446, 1746>>
    /\ y = 0
    2217:4 2: <Next line 34, col 9 to line 36, col 21 of module RandomSubsetNextTuples>
    /\ p = <<42, 23, 21>>
    /\ q = <<2613, 644, 1232>>
    /\ y = 1
    2217:4 3: <Next line 34, col 9 to line 36, col 21 of module RandomSubsetNextTuples>
    /\ p = <<62, 6, 147>>
    /\ q = <<3354, 2506, 50>>
    /\ y = 2
    2217:4 4: <Next line 34, col 9 to line 36, col 21 of module RandomSubsetNextTuples>
    /\ p = <<80, 97, 156>>
    /\ q = <<1622, 1922, 73>>
    /\ y = 3
    2217:4 5: <Next line 34, col 9 to line 36, col 21 of module RandomSubsetNextTuples>
    /\ p = <<101, 53, 73>>
    /\ q = <<1878, 2965, 2754>>
    /\ y = 4
    2217:4 6: <Next line 34, col 9 to line 36, col 21 of module RandomSubsetNextTuples>
    /\ p = <<29, 9, 66>>
    /\ q = <<1510, 2961, 1944>>
    /\ y = 5
    2217:4 7: <Next line 34, col 9 to line 36, col 21 of module RandomSubsetNextTuples>
    /\ p = <<96, 146, 28>>
    /\ q = <<822, 2914, 3062>>
    /\ y = 6
    2199:0 5461 states generated, 5461 distinct states found, 4095 states left on queue.
    2194:0 The depth of the complete state graph search is 7.
---*)
