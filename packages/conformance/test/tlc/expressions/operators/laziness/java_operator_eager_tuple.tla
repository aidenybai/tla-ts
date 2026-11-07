(*---
description: "A tuple argument to a Java operator is built eagerly, so a later bad component surfaces."
ref: "tlc2/value/impl/MethodValue.java#apply"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE java_operator_eager_tuple ----
EXTENDS Integers, Sequences
Test == Head(<<1, 1 \div 0>>) = 1
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
    0. Line 11, column 9 to line 11, column 32 in java_operator_eager_tuple
    1. Line 11, column 29 to line 11, column 32 in java_operator_eager_tuple
    2. Line 9, column 9 to line 9, column 33 in java_operator_eager_tuple
    3. Line 9, column 9 to line 9, column 29 in java_operator_eager_tuple
    4. Line 9, column 14 to line 9, column 28 in java_operator_eager_tuple
    5. Line 9, column 19 to line 9, column 26 in java_operator_eager_tuple
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in java_operator_eager_tuple
    1. Line 12, column 30 to line 12, column 33 in java_operator_eager_tuple
    2. Line 9, column 9 to line 9, column 33 in java_operator_eager_tuple
    3. Line 9, column 9 to line 9, column 29 in java_operator_eager_tuple
    4. Line 9, column 14 to line 9, column 28 in java_operator_eager_tuple
    5. Line 9, column 19 to line 9, column 26 in java_operator_eager_tuple
invariant:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in java_operator_eager_tuple
    1. Line 13, column 8 to line 13, column 32 in java_operator_eager_tuple
    2. Line 13, column 29 to line 13, column 32 in java_operator_eager_tuple
    3. Line 9, column 9 to line 9, column 33 in java_operator_eager_tuple
    4. Line 9, column 9 to line 9, column 29 in java_operator_eager_tuple
    5. Line 9, column 14 to line 9, column 28 in java_operator_eager_tuple
    6. Line 9, column 19 to line 9, column 26 in java_operator_eager_tuple
property:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in java_operator_eager_tuple
    1. Line 12, column 12 to line 12, column 36 in java_operator_eager_tuple
    2. Line 12, column 33 to line 12, column 36 in java_operator_eager_tuple
    3. Line 9, column 9 to line 9, column 33 in java_operator_eager_tuple
    4. Line 9, column 9 to line 9, column 29 in java_operator_eager_tuple
    5. Line 9, column 14 to line 9, column 28 in java_operator_eager_tuple
    6. Line 9, column 19 to line 9, column 26 in java_operator_eager_tuple
---*)
