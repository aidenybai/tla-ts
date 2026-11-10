(*---
description: "With every variable assigned, UNCHANGED x after x' = 1 takes the all-assigned fast path, which evaluates it as false and prints no warning, although the comment in getNextStates0 says this path is meant for when warnings are off, because the condition tests warn rather than !warn. The branch drops and TLC deadlocks."
ref: tlc2/tool/impl/Tool.java#processUnchangedImplVar
features:
  - tlc-bug
outcome: deadlock
config: |
  INIT Init
  NEXT Next
correct:
  all:
    exit: 11
    transcript: |-
      2190:0 Finished computing initial states: 1 distinct state generated at <date>.
      2143:3 The variable x was changed while it is specified as UNCHANGED at
      line 28, col 29 to line 28, col 29 of module after_different_value_warns
      2114:1 Deadlock reached.
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      x = 0
      2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
      2194:0 The depth of the complete state graph search is 1.
---*)
---- MODULE after_different_value_warns ----
EXTENDS Naturals, TLC
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
