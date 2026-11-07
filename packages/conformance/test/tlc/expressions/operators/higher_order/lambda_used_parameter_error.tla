(*---
description: "A LAMBDA that reaches its parameter surfaces the error of the argument."
ref: "tlc2/value/impl/OpLambdaValue.java#eval"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE lambda_used_parameter_error ----
EXTENDS Integers
Apply(f(_), a) == f(a)
Test == Apply(LAMBDA x : x, 1 \div 0) = 7
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
init:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in lambda_used_parameter_error
    1. Line 12, column 29 to line 12, column 32 in lambda_used_parameter_error
    2. Line 10, column 9 to line 10, column 41 in lambda_used_parameter_error
    3. Line 10, column 9 to line 10, column 37 in lambda_used_parameter_error
    4. Line 9, column 19 to line 9, column 22 in lambda_used_parameter_error
    5. Line 10, column 26 to line 10, column 26 in lambda_used_parameter_error
    6. Line 9, column 21 to line 9, column 21 in lambda_used_parameter_error
    7. Line 10, column 29 to line 10, column 36 in lambda_used_parameter_error
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 33 in lambda_used_parameter_error
    1. Line 13, column 30 to line 13, column 33 in lambda_used_parameter_error
    2. Line 10, column 9 to line 10, column 41 in lambda_used_parameter_error
    3. Line 10, column 9 to line 10, column 37 in lambda_used_parameter_error
    4. Line 9, column 19 to line 9, column 22 in lambda_used_parameter_error
    5. Line 10, column 26 to line 10, column 26 in lambda_used_parameter_error
    6. Line 9, column 21 to line 9, column 21 in lambda_used_parameter_error
    7. Line 10, column 29 to line 10, column 36 in lambda_used_parameter_error
invariant:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in lambda_used_parameter_error
    1. Line 14, column 8 to line 14, column 32 in lambda_used_parameter_error
    2. Line 14, column 29 to line 14, column 32 in lambda_used_parameter_error
    3. Line 10, column 9 to line 10, column 41 in lambda_used_parameter_error
    4. Line 10, column 9 to line 10, column 37 in lambda_used_parameter_error
    5. Line 9, column 19 to line 9, column 22 in lambda_used_parameter_error
    6. Line 10, column 26 to line 10, column 26 in lambda_used_parameter_error
    7. Line 9, column 21 to line 9, column 21 in lambda_used_parameter_error
    8. Line 10, column 29 to line 10, column 36 in lambda_used_parameter_error
property:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in lambda_used_parameter_error
    1. Line 13, column 12 to line 13, column 36 in lambda_used_parameter_error
    2. Line 13, column 33 to line 13, column 36 in lambda_used_parameter_error
    3. Line 10, column 9 to line 10, column 41 in lambda_used_parameter_error
    4. Line 10, column 9 to line 10, column 37 in lambda_used_parameter_error
    5. Line 9, column 19 to line 9, column 22 in lambda_used_parameter_error
    6. Line 10, column 26 to line 10, column 26 in lambda_used_parameter_error
    7. Line 9, column 21 to line 9, column 21 in lambda_used_parameter_error
    8. Line 10, column 29 to line 10, column 36 in lambda_used_parameter_error
---*)
