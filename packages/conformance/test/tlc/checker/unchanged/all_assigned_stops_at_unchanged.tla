(*---
description: "In the all-assigned fast path a conjunct UNCHANGED x is evaluated like any predicate, so a changed variable silently drops the branch with no warning, leaving a deadlock."
ref: tlc2/tool/impl/Tool.java#getNextStatesAllAssigned
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
      line 29, col 39 to line 29, col 39 of module all_assigned_stops_at_unchanged
      2114:1 Deadlock reached.
      2121:1 The behavior up to this point is:
      2217:4 1: <Initial predicate>
      /\ x = 0
      /\ y = 1
      2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
      2194:0 The depth of the complete state graph search is 1.
---*)
---- MODULE all_assigned_stops_at_unchanged ----
EXTENDS Naturals, TLC
VARIABLES x, y
Init == x = 0 /\ y = 1
Next == x' = 1 /\ y' = 2 /\ UNCHANGED x
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 1
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
