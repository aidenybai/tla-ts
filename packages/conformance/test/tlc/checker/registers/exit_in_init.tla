(*---
description: "TLCSet(\"exit\", TRUE) in Init stops the run after the initial states, before any action runs."
ref: tlc2/module/TLCGetSet.java#TLCSet
outcome: success
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE exit_in_init ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0 /\ TLCSet("exit", TRUE)
Next == x' = x
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
    2199:0 1 states generated, 1 distinct states found, 1 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
