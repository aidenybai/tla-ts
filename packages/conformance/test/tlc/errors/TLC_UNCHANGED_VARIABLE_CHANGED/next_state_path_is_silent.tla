(*---
description: "In the next-state relation, x' = 42 /\\ UNCHANGED x is just disabled: TLC prints no warning and reports the deadlock. This is a TLC bug: the fast path at Tool.java:1006 runs when warnings are on, though its comment says it is for when they are off, so warning 2143 never prints."
features: [tlc-bug]
ref: tlc2/tool/impl/Tool.java#processUnchangedImplVar
outcome: deadlock
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE next_state_path_is_silent ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = 1 /\ UNCHANGED x
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
