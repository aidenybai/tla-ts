(*---
description: Ported from TLC's RandomSubsetSetOfFcnsTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/RandomSubsetSetOfFcnsTest.java
features:
  - tlc-regression
outcome: success
config: |-
  SPECIFICATION
  Spec
  INVARIANT
  Inv
args:
  - -deadlock
---*)
--------------------------- MODULE RandomSubsetSetOfFcns ---------------------------
EXTENDS Integers, FiniteSets, Randomization

VARIABLE x

S == {1,2,3,4,5,6,7,8,9}
T == 1..10

\* Nine copies of T in a Cartesian product make a set of the same 10^9
\* functions, because a tuple is a function whose domain is an interval:
\*
\*     THEOREM \A U : U \X U = [1..2 -> U]
\*
\* which is the case n = 2 of the claim about the nine components below. TLC
\* therefore has to draw from the product without enumerating it either.
\*
\* An assumption rather than a second conjunct of Init, because TLC redraws per
\* value of x, so a second draw would turn the 1000 initial states into 10^6,
\* whereas TLC checks it either way.
Product == T \X T \X T \X T \X T \X T \X T \X T \X T

ASSUME Cardinality(RandomSubset(1000, Product)) = 1000
ASSUME RandomSubset(1000, Product) \subseteq Product
ASSUME RandomSubset(1000, Product) \subseteq [1..9 -> T]

\* [S->T] has 10^9 elements of which we want 1k.
\* Explicitly enumerating all 10^9 elements will
\* definitely timeout the tests.
Init == /\ x \in RandomSubset(1000, [ S -> T ])

Next == /\ UNCHANGED <<x>>

Spec == Init /\ [][Next]_<<x>>

Inv == TRUE
=============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2149:3 The invariant Inv is a constant-level formula (i.e., it contains no variables, primes, or temporal operators) and evaluates to TRUE. To assert constant-level formulas in your spec, use ASSUME ConstInv. If you optionally want to give the assumption a name, write ASSUME YourAssumption == ConstInv instead. See https://explain.tlapl.us/assumptions-and-invariants for additional details.
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2269:0 Computed 8 initial states...
    2269:0 Computed 16 initial states...
    2269:0 Computed 32 initial states...
    2269:0 Computed 64 initial states...
    2269:0 Computed 128 initial states...
    2269:0 Computed 256 initial states...
    2269:0 Computed 512 initial states...
    2190:0 Finished computing initial states: 1000 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.4E-14
    2199:0 2000 states generated, 1000 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
