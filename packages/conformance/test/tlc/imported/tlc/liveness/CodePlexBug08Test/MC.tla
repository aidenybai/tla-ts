(*---
description: Ported from TLC's CodePlexBug08Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/CodePlexBug08Test.java
features:
  - tlc-regression
outcome: liveness-violation
config: |
  \* SPECIFICATION definition
  SPECIFICATION
  spec_14235897021122000
  \* PROPERTY definition
  PROPERTY
  prop_14235897021223000
  PROPERTY neg_prop_14235897021223000
  PROPERTY XEventuallyGrows
  \* Generated on Tue Feb 10 18:35:02 CET 2015
  PROPERTY Tautology
args:
  - -deadlock
includes:
  - CodeplexBug8.tla
  - EWD840MC2_TTrace_2000000000_Expected.json
---*)
---- MODULE MC ----
EXTENDS CodeplexBug8, TLC

\* SPECIFICATION definition @modelBehaviorSpec:0
spec_14235897021122000 ==
Spec
----
\* PROPERTY definition @modelCorrectnessProperties:0
prop_14235897021223000 ==
Xshrinks
----
\* NEGATED PROPERTY definition
neg_prop_14235897021223000 ==
~(Xshrinks)
----

XEventuallyGrows == <>(x >= 4)

Tautology == (x = x) ~> (x = x)
=============================================================================
\* Modification History
\* Created Tue Feb 10 18:35:02 CET 2015 by markus

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 4 branches.
    2269:0 Computed 2 initial states...
    2269:0 Computed 4 initial states...
    2190:0 Finished computing initial states: 8 distinct states generated at <date>.
    2192:0 Checking 4 branches of temporal properties for the complete state space with 44 total distinct states at (<date>)
    2116:1 Temporal property prop_14235897021223000 was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    /\ b = FALSE
    /\ x = 2
    2217:4 2: <B line 11, col 6 to line 13, col 18 of module CodeplexBug8>
    /\ b = TRUE
    /\ x = 3
    2217:4 3: <A line 6, col 6 to line 9, col 19 of module CodeplexBug8>
    /\ b = FALSE
    /\ x = 3
    2217:4 4: <B line 11, col 6 to line 13, col 18 of module CodeplexBug8>
    /\ b = TRUE
    /\ x = 4
    2217:4 5: <A line 6, col 6 to line 9, col 19 of module CodeplexBug8>
    /\ b = FALSE
    /\ x = 4
    2217:4 6: <B line 11, col 6 to line 13, col 18 of module CodeplexBug8>
    /\ b = TRUE
    /\ x = 5
    2218:4 7: Stuttering
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 18 states generated, 11 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 4.
---*)
