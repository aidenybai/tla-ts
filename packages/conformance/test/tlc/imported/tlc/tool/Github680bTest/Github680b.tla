(*---
description: Ported from TLC's Github680bTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github680bTest.java
features:
  - tlc-regression
outcome: success
args:
  - -config
  - Github680b.tla
  - -nowarning
  - -deadlock
---*)
---- MODULE Github680b ----
VARIABLES x,y

Init == x = 0 /\ y = 0
Next == 
    /\ x' = 42
    /\ UNCHANGED <<y,x>>
====
---- CONFIG Github680b ----
INIT Init
NEXT Next
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
    2268:0 The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).
---*)
