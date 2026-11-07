(*---
description: The extractor scans the whole file, so a block ahead of the module applies. Here the block is held in a comment-free header area before the module start line.
ref: util/MonolithSpecExtractor.java#config
outcome: success
args:
  - -config
  - block_before_the_module.tla
---*)
---- MODULE block_before_the_module ----
(* The block below ends the search before the rest of the file.
---- CONFIG block_before_the_module ----
INIT Init
NEXT Next
====
*)
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 1.6E-19
    2199:0 4 states generated, 3 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 3.
    2268:0 The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).
---*)
