(*---
description: Ported from TLC's Github687specPrimeTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github687specPrimeTest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |-
  SPECIFICATION SpecB
  PROPERTY FalseAECheck
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
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2190:0 Finished computing initial states: 7 distinct states generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 7 total distinct states at (<date>)
    2116:1 Temporal property FalseAECheck was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    value = 0
    2217:4 2: <Z7!Increment(7) line 41, col 1 to line 41, col 32 of module Github687spec>
    value = 1
    2217:4 3: <Z7!Increment(7) line 41, col 1 to line 41, col 32 of module Github687spec>
    value = 2
    2217:4 4: <Z7!Increment(7) line 41, col 1 to line 41, col 32 of module Github687spec>
    value = 3
    2217:4 5: <Z7!Increment(7) line 41, col 1 to line 41, col 32 of module Github687spec>
    value = 4
    2217:4 6: <Z7!Increment(7) line 41, col 1 to line 41, col 32 of module Github687spec>
    value = 5
    2217:4 7: <Z7!Increment(7) line 41, col 1 to line 41, col 32 of module Github687spec>
    value = 6
    2122:4 1: Back to state: <Z7!Increment(7) line 41, col 1 to line 41, col 32 of module Github687spec>
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 14 states generated, 7 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
