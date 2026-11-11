(*---
description: 'An instanced spec covers only the outer variables it maps: an outer variable unknown to the instance is warned about, and its successor is undefined.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec (SubscriptCollector)
features: [liveness, subscript]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE instance_subscript_partial ----
EXTENDS Naturals
VARIABLES x, y
Init == x = 0 /\ y = 0
Next == x < 1 /\ x' = x + 1 /\ y' = y

---- MODULE Inner ----
VARIABLE v
InnerSpec == v = 0 /\ [][v' = v /\ UNCHANGED v]_v
====
I == INSTANCE Inner WITH v <- x
Spec == y = 0 /\ I!InnerSpec
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2140:3 The subscript of the next-state relation specified by the specification
    does not seem to contain the state variable y
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    2109:1 Successor state is not completely specified by the next-state action. The following variable is not defined: y.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    /\ x = 0
    /\ y = 0
    2217:4 2: <Action line 20, col 1 to line 20, col 31 of module instance_subscript_partial>
    /\ x = 0
    /\ y = null
    2199:0 2 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
