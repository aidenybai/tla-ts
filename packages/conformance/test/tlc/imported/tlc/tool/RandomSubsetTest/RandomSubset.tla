(*---
description: Ported from TLC's RandomSubsetTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/RandomSubsetTest.java
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
--------------------------- MODULE RandomSubset ---------------------------
EXTENDS Integers, FiniteSets, Randomization

VARIABLE x, y, z, p, q

Product == (1..200) \X (1..200) \X (1..200)
BigProduct == (1..4000) \X (1..4000) \X (1..4000)

\* p and q draw from a product where TLC generates states, Product having
\* fewer elements than an int holds and BigProduct more.
Init == /\ x \in RandomSubset(1001, 1..100000000)
        /\ y \in RandomSubset(2, 100000000..100000010)
        /\ z = TRUE
        /\ p \in RandomSubset(2, Product)
        /\ q \in RandomSubset(2, BigProduct)

Next == /\ UNCHANGED <<x, y, p, q>>
        /\ z' = FALSE
        

Spec == Init /\ [][Next]_<<x,y,z,p,q>>

Inv == z = TRUE

\* Unlike Inv, never violated, so it reaches every drawn tuple and not only the
\* one that the error trace prints.
TypeOK == /\ x \in 1..100000000
          /\ y \in 100000000..100000010
          /\ z \in BOOLEAN
          /\ p \in Product
          /\ q \in BigProduct

ASSUME Cardinality(RandomSubset(1000, Product)) = 1000
ASSUME RandomSubset(1000, Product) \subseteq Product

ASSUME Cardinality(RandomSubset(1000, BigProduct)) = 1000
ASSUME RandomSubset(1000, BigProduct) \subseteq BigProduct

\* The same products read as sets of functions on 1..3, which a tuple being a
\* function on an interval makes them, so a drawn tuple is one of those.
ASSUME RandomSubset(1000, Product) \subseteq [1..3 -> 1..200]
ASSUME RandomSubset(1000, BigProduct) \subseteq [1..3 -> 1..4000]
=============================================================================

(*--- recorded
all:
  exit: 12
  transcript: |-
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2269:0 Computed 8 initial states...
    2269:0 Computed 16 initial states...
    2269:0 Computed 32 initial states...
    2269:0 Computed 64 initial states...
    2269:0 Computed 128 initial states...
    2269:0 Computed 256 initial states...
    2269:0 Computed 512 initial states...
    2269:0 Computed 1024 initial states...
    2269:0 Computed 2048 initial states...
    2269:0 Computed 4096 initial states...
    2190:0 Finished computing initial states: 8008 distinct states generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ p = <<62, 49, 166>>
    /\ q = <<2487, 674, 1426>>
    /\ x = 38314
    /\ y = 100000006
    /\ z = TRUE
    2217:4 2: <Next line 32, col 9 to line 33, col 21 of module RandomSubset>
    /\ p = <<62, 49, 166>>
    /\ q = <<2487, 674, 1426>>
    /\ x = 38314
    /\ y = 100000006
    /\ z = FALSE
    2199:0 8009 states generated, 8009 distinct states found, 8007 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
