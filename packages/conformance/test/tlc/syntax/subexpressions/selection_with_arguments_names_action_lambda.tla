(*---
description: "An action that a selection with arguments takes is named LAMBDA, the operator SANY makes for the selection."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
outcome: safety-violation
---*)
---- MODULE selection_with_arguments_names_action_lambda ----
EXTENDS Naturals
VARIABLE x
Def(i) == x' = x + i /\ TRUE
Init == x = 0
Next == Def(5)!1
Inv == x < 2
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
    2217:4 2: <LAMBDA(5) line 14, col 11 to line 14, col 20 of module selection_with_arguments_names_action_lambda>
    x = 5
    2199:0 2 states generated, 2 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 2.
---*)
