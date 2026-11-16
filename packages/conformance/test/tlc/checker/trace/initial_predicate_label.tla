(*---
description: The first state of a trace is labelled <Initial predicate> whatever the predicate is named.
ref: tlc2/tool/TLCStateInfo.java#TLCStateInfo
outcome: safety-violation
config: |
  INIT Start
  NEXT Go
  INVARIANT Inv
---*)
---- MODULE initial_predicate_label ----
EXTENDS Naturals, TLC
VARIABLE x
Start == x = 0
Go == x' = 1
Inv == x = 0
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
    2217:4 2: <Go line 14, col 7 to line 14, col 12 of module initial_predicate_label>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
