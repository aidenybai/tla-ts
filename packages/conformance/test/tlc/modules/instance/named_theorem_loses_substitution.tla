(*---
description: "TLC evaluates M!T without the instance's substitution, so a theorem or assumption reading a substituted constant fails with a null value message instead of evaluating. The cause is SpecProcessor#processConstants, which never visits an imported theorem or assumption body."
ref: "tlc2/tool/impl/Tool.java#evalImpl"
features: [instance, tlc-bug]
outcome: evaluation-failure
correct:
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
---- MODULE named_theorem_loses_substitution ----
---- MODULE I ----
CONSTANT c
THEOREM T == c = 1
====
M == INSTANCE I WITH c <- 1
ASSUME M!T
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 24, col 8 to line 24, col 10 of module named_theorem_loses_substitution failed.
    Cannot invoke "Object.equals(Object)" because "arg1" is null
---*)
