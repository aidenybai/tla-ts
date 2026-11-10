(*---
description: The report also covers a property's formula.
ref: tlc2/tool/coverage/CostModelCreator.java
outcome: success
config: |
  SPECIFICATION Spec
  PROPERTY Prop
args:
  - -coverage
  - "1"
---*)
---- MODULE spec_form ----
EXTENDS Naturals
VARIABLE x
Init == x \in {0, 1}
A == x < 3 /\ x' = x + 1
B == x = 3 /\ x' = 0
Next == A \/ B
C == x < 9
AC == x' < 9
Inv == x < 9
Spec == Init /\ [][Next]_x /\ WF_x(Next)
Prop == <>(x = 3)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 2 distinct states generated at <date>.
    2192:0 Checking temporal properties for the complete state space with 4 total distinct states at (<date>)
    2267:0 Finished checking temporal properties in <time> at <date>
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 4.3E-19
    2201:0 The coverage statistics at <date> (see https://explain.tlapl.us/module-coverage-statistics for how to interpret the following statistics).
    2779:0 <x line 14, col 10 to line 14, col 10 of module spec_form>: 2
    2773:0 <Init line 15, col 1 to line 15, col 4 of module spec_form>: 2:2
    2221:0   line 15, col 9 to line 15, col 20 of module spec_form: 2
    2775:0   |line 15, col 15 to line 15, col 20 of module spec_form: 1:3
    2772:0 <A line 16, col 1 to line 16, col 1 of module spec_form>: 2:3
    2221:0   line 16, col 6 to line 16, col 10 of module spec_form: 3
    2221:0   |line 16, col 6 to line 16, col 6 of module spec_form: 4
    2221:0   line 16, col 15 to line 16, col 24 of module spec_form: 3
    2772:0 <B line 17, col 1 to line 17, col 1 of module spec_form>: 0:1
    2221:0   line 17, col 6 to line 17, col 10 of module spec_form: 5
    2221:0   |line 17, col 6 to line 17, col 6 of module spec_form: 4
    2221:0   line 17, col 15 to line 17, col 20 of module spec_form: 1
    2202:0 End of statistics.
    2199:0 6 states generated, 4 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
