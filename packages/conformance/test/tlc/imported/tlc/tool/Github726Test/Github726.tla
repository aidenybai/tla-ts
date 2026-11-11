(*---
description: Ported from TLC's Github726Test.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/Github726Test.java
features:
  - tlc-regression
outcome: success
config: ""
args:
  - -deadlock
---*)
-------------------------------- MODULE Github726 --------------------------------
EXTENDS TLC

msgs == [ a |-> [ data |-> 15 ] ]

GetMsg(dst) ==
    [ dst |-> dst ] @@ msgs[dst]

Pair ==
    LET m == GetMsg("a")
    IN <<m, m>>

ASSUME Pair[1] = Pair[2]

PrintPrintGetMsg ==
    LET m == GetMsg("a")  \* expect: [data |-> 15, dst |-> "a"]
    IN <<PrintT(m) , PrintT(m)>>

ASSUME PrintPrintGetMsg = <<TRUE, TRUE>>

=============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    | [data |-> 15, dst |-> "a"]
    | [data |-> 15, dst |-> "a"]
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
