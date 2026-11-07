(*---
description: 'A variable mapped to an arithmetic expression contributes nothing, so the outer variable is reported as missing, and the primed expression then fails to evaluate.'
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec (SubscriptCollector)
features: [liveness, subscript]
outcome: evaluation-failure
config: |
  SPECIFICATION Spec
  CHECK_DEADLOCK FALSE
---*)
---- MODULE instance_substituted_expression ----
EXTENDS Naturals
VARIABLE x

---- MODULE Inner ----
VARIABLE v
InnerNext == v' = v
InnerSpec == v = 1 /\ [][InnerNext]_v
====
I == INSTANCE Inner WITH v <- x + 1
Spec == I!InnerSpec
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2140:3 The subscript of the next-state relation specified by the specification
    does not seem to contain the state variable x
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 19, col 31 to line 19, col 31 of module instance_substituted_expression
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 19, col 31 to line 19, col 31 of module instance_substituted_expression
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 1 to line 19, column 35 in instance_substituted_expression
    1. Line 17, column 14 to line 17, column 18 in instance_substituted_expression
    2. Line 17, column 14 to line 17, column 14 in instance_substituted_expression
    3. Line 19, column 31 to line 19, column 35 in instance_substituted_expression
    4. Line 19, column 31 to line 19, column 31 in instance_substituted_expression
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
