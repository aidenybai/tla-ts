(*---
description: Ported from TLC's Github687specCTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github687specCTest.java
features:
  - tlc-regression
outcome: success
config: SPECIFICATION SpecC
args:
  - -deadlock
---*)
---------------------------- MODULE Github687spec ---------------------------
EXTENDS Naturals

VARIABLE value

  ---------- MODULE Ring ----------
  VARIABLE cardinality
  
  RingMembers == (0 .. (cardinality - 1))
  
  Init == /\ cardinality > 1
          /\ value \in RingMembers
          
  Increment == value' = (value + 1) % cardinality
  Decrement == value' = IF value = 0 THEN (cardinality - 1) ELSE (value - 1)
  
  Next == \/ Increment
          \/ Decrement
  
  Spec == /\ Init
          /\ [][Next]_<<value, cardinality>>
          
  CycleStep == value' = 0 /\ value = (cardinality - 1)
  IncorrectCycleStep == value' = 1 /\ value = (cardinality - 1)

  x $$ y == (x + y) % cardinality
  =================================
  
Z7(cardinality) == INSTANCE Ring

\* Parameterized instance invoking custom infix operator
ModSanityCheck == Z7(7)!$$(5,9) < 7

\* Referencing a single parameterized instance's definition
SpecA == Z7(7)!Spec

\* A conjunction referencing the parameterized instance's
\*		definitions of Init and Increment, as well as the 
\*		custom infix usage, weak fairness, and the temporal
\*		always-eventually check.
SpecB == /\ Z7(7)!Init
         /\ [][Z7(7)!Increment]_value
         /\ WF_value(Z7(7)!Next)
         /\ ModSanityCheck
AECheck == []<><<Z7(7)!CycleStep>>_value

\* A conjunction referencing the parameterized instance's
\*		definitions of Init and Next, as well as strong
\*		fairness on one of the instance's Next's subactions
SpecC == /\ Z7(7)!Init
         /\ [][Z7(7)!Next]_value
         /\ SF_value(Z7(7)!Increment)


\* INIT-NEXT test
Init == Z7(7)!Init
Next == Z7(7)!Next


\* Failing cases:
\* Used in the 'ParameterizedSpecBPrime' unit test
FalseAECheck == []<><<Z7(7)!IncorrectCycleStep>>_value
\* We cannot just negate ModSanityCheck because that is no longer a
\*		"trivially false" error message, rather it just prevents
\*		state generation. This should probably be considered a bug.
ModInsanityCheck == Z7(7)!$$(5,9) > 7
SpecD == Z7(7)!Spec /\ ModInsanityCheck
=============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2190:0 Finished computing initial states: 7 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.3E-18
    2199:0 21 states generated, 7 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
