(*---
description: 'A constant conjunct such as 1 is level 0 so it becomes an initial predicate, then fails when TLC evaluates it.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
features: [liveness]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE non_boolean_conjunct ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

Spec == 1 /\ Init /\ [][Next]_x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 The init state relation is not a boolean expression.
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 9 in non_boolean_conjunct
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
