(*---
description: Ported from TLC's CodePlexBug21Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/CodePlexBug21Test.java
features:
  - tlc-regression
outcome: success
config: ""
args:
  - -deadlock
---*)
--------------------------- MODULE CodePlexBug21 ---------------------------
EXTENDS Naturals, TLC

func1 == [x \in 1..3 |-> x]
func2 == <<1,2,3>>

ASSUME func1 = func2 \* evaluated to TRUE
ASSUME 3 :> 11 @@ func1 = <<1,2,11>> \* evaluated to TRUE

ASSUME 3 :> 11 @@ func2 = <<1,2,11>> \* erroneously evaluated to FALSE

ASSUME 4 :> 11 @@ func2 = <<1,2,3,11>> \* throws a TLC error
=============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
