(*---
description: 'An action that says nothing about a variable fails during generation with an incompletely specified state, regardless of the subscript.'
ref: tlc2/tool/impl/Tool.java#getNextStates
features: [liveness, subscript]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE action_silent_about_subscript_variable ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == x < 1 /\ x' = x + 1 /\ y' = y

N == x < 1 /\ x' = x + 1
Spec == Init /\ [][N]_<<x, y>>
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2109:1 Successor state is not completely specified by the next-state action. The following variable is not defined: y.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2217:4 2: <N line 16, col 6 to line 16, col 24 of module action_silent_about_subscript_variable>
    /\ x = 1
    /\ y = null
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
