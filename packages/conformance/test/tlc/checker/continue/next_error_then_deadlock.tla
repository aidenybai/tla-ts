(*---
description: "With -continue, an evaluation error in Next is printed and then the same state is reported as a deadlock, which sets the exit. This is a TLC bug: setErrState lets the deadlock check overwrite the error under -continue."
features: [tlc-bug]
ref: tlc2/tool/Worker.java#run
outcome: deadlock
config: |
  INIT Init
  NEXT Next
args:
  - -continue
---*)
---- MODULE next_error_then_deadlock ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = 1 \div (1 - x)
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 16, col 9 to line 16, col 27 of module next_error_then_deadlock>
    x = 1
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2217:4 2: <Next line 16, col 9 to line 16, col 27 of module next_error_then_deadlock>
    x = 1
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
