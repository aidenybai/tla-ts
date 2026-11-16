(*---
description: Ported from TLC's Github680cTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github680cTest.java
features:
  - tlc-regression
outcome: success
args:
  - -config
  - Github680c.tla
  - -nowarning
  - -deadlock
---*)
---- MODULE Github680c ----
VARIABLES x,y

Init == x = 0 /\ y = 0
Next == 
    /\ y' = 0
    /\ x' = 42
    /\ UNCHANGED <<y,x>>
====
---- CONFIG Github680c ----
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
