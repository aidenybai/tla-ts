(*---
description: An instance variable substituted by an expression doesn't assign when primed, so it fails.
ref: tlc2/tool/impl/Spec.java#getPrimedVar
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE instance_substituted_expression_primed ----
EXTENDS Naturals, TLC
VARIABLE x
---- MODULE inner ----
VARIABLE v
Go == v' = 1
====
I == INSTANCE inner WITH v <- x + 1
Init == x = 0
Next == I!Go /\ x' = 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2190:0 Finished computing initial states: 1 distinct state generated at <date>.
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    :
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 16, col 31 to line 16, col 31 of module instance_substituted_expression_primed
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    x = 0
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 18, column 9 to line 18, column 22 in instance_substituted_expression_primed
    1. Line 18, column 9 to line 18, column 12 in instance_substituted_expression_primed
    2. Line 16, column 1 to line 16, column 35 in instance_substituted_expression_primed
    3. Line 14, column 7 to line 14, column 12 in instance_substituted_expression_primed
    4. Line 14, column 7 to line 14, column 8 in instance_substituted_expression_primed
    5. Line 14, column 7 to line 14, column 7 in instance_substituted_expression_primed
    6. Line 16, column 31 to line 16, column 35 in instance_substituted_expression_primed
    7. Line 16, column 31 to line 16, column 31 in instance_substituted_expression_primed
    2199:0 1 states generated, 1 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
