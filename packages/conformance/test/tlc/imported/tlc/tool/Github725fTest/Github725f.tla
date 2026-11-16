(*---
description: Ported from TLC's Github725fTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github725fTest.java
features:
  - tlc-regression
outcome: success
config: |
  SPECIFICATION Spec
  PROPERTY SpecRunsToEnd
args:
  - -deadlock
---*)
---- MODULE Github725f ----
EXTENDS Sequences, Naturals

VARIABLES outerRes, outerSeq

---- MODULE Inner725f ----
    VARIABLES res, myseq

    Step ==
        /\ res = 0
        /\ res' = 1
        /\ myseq' = SelectSeq(myseq, LAMBDA e: e /= res')

    Fairness == WF_<<res, myseq>>(Step)
====

Svc == INSTANCE Inner725f WITH res <- outerRes, myseq <- outerSeq

Init ==
    /\ outerSeq = <<1, 2, 3>>
    /\ outerRes = 0

Step ==
    \/ Svc!Step
    \/ ~ENABLED Svc!Step /\ UNCHANGED <<outerRes, outerSeq>>

Spec ==
    /\ Init
    /\ [][Step]_<<outerRes, outerSeq>>
    /\ Svc!Fairness

SpecRunsToEnd == <>[](~ENABLED Svc!Step)

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 2 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.1E-19
    2199:0 3 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
