(*---
description: Ported from TLC's ExamplesSingleLaneBridgeTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/ExamplesSingleLaneBridgeTest.java
features:
  - tlc-regression
outcome: success
config: |-
  \* CONSTANT definitions
  CONSTANT
  CarsRight <- const_1615720459299211000
  \* CONSTANT definitions
  CONSTANT
  CarsLeft <- const_1615720459299212000
  \* CONSTANT definitions
  CONSTANT
  Bridge <- const_1615720459299213000
  \* CONSTANT definitions
  CONSTANT
  Positions <- const_1615720459299214000
  \* SPECIFICATION definition
  SPECIFICATION
  Spec
  \* INVARIANT definition
  INVARIANT
  Invariants
  \* PROPERTY definition
  PROPERTY
  CarsInBridgeExitBridge
  CarsEnterBridge
  CarsInfOftenOnBridge
  \* Generated on Sun Mar 14 12:14:19 CET 2021
args:
  - -lncheck
  - final
  - -deadlock
includes:
  - SingleLaneBridge.tla
---*)
---- MODULE MC ----
EXTENDS SingleLaneBridge, TLC

\* CONSTANT definitions @modelParameterConstants:0CarsRight
const_1615720459299211000 == 
{"r1","r2"}
----

\* CONSTANT definitions @modelParameterConstants:1CarsLeft
const_1615720459299212000 == 
{"l1","l2"}
----

\* CONSTANT definitions @modelParameterConstants:2Bridge
const_1615720459299213000 == 
{4,5}
----

\* CONSTANT definitions @modelParameterConstants:3Positions
const_1615720459299214000 == 
{1,2,3,4,5,6,7,8}
----

CarsInfOftenOnBridge == \A car \in CarsRight : []<>(Location[car] \in Bridge)

=============================================================================
\* Modification History
\* Last modified Sun Oct 10 22:023:42 CEST 2021 by youne

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 9 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking 9 branches of temporal properties for the complete state space with 32445 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 3.2E-12
    2199:0 20181 states generated, 3605 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 29.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 4 and the 95th percentile is 2).
---*)
