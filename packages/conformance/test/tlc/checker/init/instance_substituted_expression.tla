(*---
description: WITH v <- x + 1 makes the instance's v an expression, so v = 1 doesn't assign and fails on x.
ref: tlc2/tool/impl/Spec.java#getVar
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE instance_substituted_expression ----
EXTENDS Naturals, TLC
VARIABLE x
---- MODULE inner ----
VARIABLE v
InnerInit == v = 1
====
I == INSTANCE inner WITH v <- x + 1
Next == UNCHANGED x
Init == I!InnerInit
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 
    2280:0 In evaluation, the identifier x is either undefined or not an operator.
    line 16, col 31 to line 16, col 31 of module instance_substituted_expression
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 18, column 9 to line 18, column 19 in instance_substituted_expression
    1. Line 16, column 1 to line 16, column 35 in instance_substituted_expression
    2. Line 14, column 14 to line 14, column 18 in instance_substituted_expression
    3. Line 14, column 14 to line 14, column 14 in instance_substituted_expression
    4. Line 16, column 31 to line 16, column 35 in instance_substituted_expression
    5. Line 16, column 31 to line 16, column 31 in instance_substituted_expression
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
