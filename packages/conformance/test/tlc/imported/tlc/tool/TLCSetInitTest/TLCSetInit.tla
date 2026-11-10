(*---
description: Ported from TLC's TLCSetInitTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/TLCSetInitTest.java
features:
  - tlc-regression
outcome: success
config: |
  INIT
  Init
  NEXT
  Next
  _POSSIBLE AtFive Step
  POSTCONDITION PossibleCounts
args:
  - -deadlock
---*)
----- MODULE TLCSetInit -----
EXTENDS Integers, TLC

VARIABLES x

Init == x = 1 /\ TLCSet(1,"TLCSet works.")
Next == x < 10 /\ x' = x + 1 /\ PrintT(TLCGet(1))

AtFive == x = 5

Step == x' = x + 1

PossibleCounts ==
    LET p == TLCGet("all:named")["s:_possible"][1]
    IN /\ p["AtFive"] = 1
       /\ p["Step"] = 9

=====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    | "TLCSet works."
    | "TLCSet works."
    | "TLCSet works."
    | "TLCSet works."
    | "TLCSet works."
    | "TLCSet works."
    | "TLCSet works."
    | "TLCSet works."
    | "TLCSet works."
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 10 states generated, 10 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 10.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
