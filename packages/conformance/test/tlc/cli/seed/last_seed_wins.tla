(*---
description: A later -seed replaces an earlier one, here the runner's own.
ref: tlc2/TLC.java#handleParameters
outcome: success
config: ""
args:
  - -seed
  - "1"
  - -seed
  - "7"
---*)
---- MODULE last_seed_wins ----
EXTENDS Naturals, TLC
ASSUME PrintT(RandomElement(1..1000000))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 730700
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
