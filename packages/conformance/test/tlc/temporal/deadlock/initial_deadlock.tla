(*---
description: 'An initial state with no successors deadlocks immediately, ahead of a temporal check.'
ref: tlc2/tool/Worker.java#doNext
features: [liveness, deadlock]
outcome: deadlock
config: |
  SPECIFICATION Spec
  PROPERTY Prop
---*)
---- MODULE initial_deadlock ----
VARIABLE x
Spec == x = 0 /\ [][FALSE]_x
Prop == []<>(x = 99)
====

(*--- recorded
all:
  exit: 11
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 1 branches.
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2114:1 Deadlock reached.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
