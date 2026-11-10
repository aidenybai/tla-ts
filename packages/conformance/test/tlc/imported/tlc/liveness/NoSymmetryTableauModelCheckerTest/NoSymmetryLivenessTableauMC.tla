(*---
description: Ported from TLC's NoSymmetryTableauModelCheckerTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/NoSymmetryTableauModelCheckerTest.java
features:
  - tlc-regression
outcome: success
config: |-
  \* MV CONSTANT declarations
  CONSTANTS
  a = a
  b = b
  \* MV CONSTANT declarations
  CONSTANTS
  c = c
  d = d
  \* MV CONSTANT declarations
  CONSTANTS
  e = e
  f = f
  \* MV CONSTANT definitions
  CONSTANT
  Val <- const_144172196716899000
  \* MV CONSTANT definitions
  CONSTANT
  Proc <- const_1441721967178100000
  \* MV CONSTANT definitions
  CONSTANT
  Adr <- const_1441721967189101000
  \* CONSTANT definition
  CONSTANT
  NoVal = NoVal
  \* SPECIFICATION definition
  SPECIFICATION
  spec_1441721967209103000
  \* PROPERTY definition
  PROPERTY
  prop_1441721967219104000
  \* Generated on Tue Sep 08 16:19:27 CEST 2015
args:
  - -deadlock
includes:
  - SymmetryLivenessTableau.tla
---*)
---- MODULE NoSymmetryLivenessTableauMC ----
EXTENDS SymmetryLivenessTableau, TLC

\* MV CONSTANT declarations@modelParameterConstants
CONSTANTS
a, b
----

\* MV CONSTANT declarations@modelParameterConstants
CONSTANTS
c, d
----

\* MV CONSTANT declarations@modelParameterConstants
CONSTANTS
e, f
----

\* MV CONSTANT definitions Val
const_144172196716899000 == 
{a, b}
----

\* MV CONSTANT definitions Proc
const_1441721967178100000 == 
{c, d}
----

\* MV CONSTANT definitions Adr
const_1441721967189101000 == 
{e, f}
----

\* SPECIFICATION definition @modelBehaviorSpec:0
spec_1441721967209103000 ==
Spec
----
\* PROPERTY definition @modelCorrectnessProperties:0
prop_1441721967219104000 ==
Liveness
----
=============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 2 branches.
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2190:0 Finished computing initial states: 8 distinct states generated at <date>.
    2192:0 Checking 2 branches of temporal properties for the complete state space with 2544 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 2.9E-13
    2199:0 5492 states generated, 1272 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 10.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 12 and the 95th percentile is 6).
---*)
