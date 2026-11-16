(*---
description: Ported from TLC's ConstantOperatorConfigurationTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/ConstantOperatorConfigurationTest.java
features:
  - tlc-regression
outcome: safety-violation
config: |
  INIT Init
  NEXT Next

  CONSTANT
      F(0) = 1
      F(1) = 2
      F(2) = 2

  INVARIANT Inv
args:
  - -deadlock
---*)
---- MODULE ConstantOperatorConfiguration ----

CONSTANT F(_)
VARIABLE x

Init == x = 0
Next == x' = F(x)
Inv == x /= 2

====

(*--- recorded
all:
  exit: 12
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2110:1 Invariant Inv is violated.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 26, col 9 to line 26, col 17 of module ConstantOperatorConfiguration>
    x = 1
    2217:4 3: <Next line 26, col 9 to line 26, col 17 of module ConstantOperatorConfiguration>
    x = 2
    2199:0 3 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
---*)
