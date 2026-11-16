(*---
description: Membership in SUBSET doesn't enumerate it, so the bound doesn't apply.
ref: tlc2/value/impl/SubsetValue.java#member
outcome: success
config: ""
args:
  - -maxSetSize
  - "2"
---*)
---- MODULE lazy_membership_needs_no_enumeration ----
ASSUME {1} \in SUBSET {1, 2, 3, 4, 5, 6}
====

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
