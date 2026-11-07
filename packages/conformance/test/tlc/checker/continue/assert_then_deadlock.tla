(*---
description: "With -continue, a failed Assert in Next is printed and then the same state is reported as a deadlock, which sets the exit. This is a TLC bug: setErrState lets the deadlock check overwrite the error under -continue."
features: [tlc-bug]
ref: tlc2/tool/Worker.java#run
outcome: deadlock
config: |
  INIT Init
  NEXT Next
args:
  - -continue
---*)
---- MODULE assert_then_deadlock ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == Assert(x < 1, "m") /\ x' = x + 1
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2132:1 The first argument of Assert evaluated to FALSE; the second argument was:
    "m"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 15, col 9 to line 15, col 40 of module assert_then_deadlock>
    x = 1
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 15, col 9 to line 15, col 40 of module assert_then_deadlock>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
