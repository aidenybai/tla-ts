(*---
description: Ported from TLC's Github1302cTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github1302cTest.java
features:
  - tlc-regression
outcome: success
args:
  - -config
  - Github1302c.tla
  - -deadlock
---*)
---- MODULE Github1302c ----
EXTENDS TLC, TLCExt

\* Non-Reducible domain so the outer function stays a lazy FcnLambdaValue.
S == [{1} -> {1, 2}]
I == [s \in S |-> 0]

r1 == [i \in {1} |-> 1]
r2 == [i \in {1} |-> 2]

fcn == r1 :> 10

VARIABLES x, y

Init ==
    /\ x = [I EXCEPT ![r1] = fcn] \* (<<1>> :> (<<1>> :> 10) @@ <<2>> :> 0)
    /\ y = [x EXCEPT ![r2] = 99]  \* (<<1>> :> (<<1>> :> 10) @@ <<2>> :> 99)

Next == UNCHANGED <<x, y>>

\* Evaluating correct from scratch creates fresh ValueExcept objects that are
\* not shared with x, so no corruption occurs.
correct == [([([s \in S |-> 0]) EXCEPT ![r1] = fcn]) EXCEPT ![r2] = 99]

Inv == TLCFP(y) = TLCFP(correct)

=====
----- CONFIG Github1302c ----
INIT Init
NEXT Next
INVARIANT Inv
========

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 5.4E-20
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
