(*---
description: "Comparing a recursive function evaluates every argument."
ref: "tlc2/value/impl/FcnLambdaValue.java#toFcnRcd"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE compare_forces_every_branch ----
EXTENDS Integers
F[n \in 0..2] == IF n = 2 THEN 1 \div 0 ELSE IF n = 0 THEN 0 ELSE F[n - 1]
Test == F = F
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
    0. Line 12, column 9 to line 12, column 32 in compare_forces_every_branch
    1. Line 12, column 29 to line 12, column 32 in compare_forces_every_branch
    2. Line 10, column 9 to line 10, column 13 in compare_forces_every_branch
    3. Line 9, column 18 to line 9, column 74 in compare_forces_every_branch
    4. Line 9, column 32 to line 9, column 39 in compare_forces_every_branch
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 13, column 9 to line 13, column 33 in compare_forces_every_branch
    1. Line 13, column 30 to line 13, column 33 in compare_forces_every_branch
    2. Line 10, column 9 to line 10, column 13 in compare_forces_every_branch
    3. Line 9, column 18 to line 9, column 74 in compare_forces_every_branch
    4. Line 9, column 32 to line 9, column 39 in compare_forces_every_branch
invariant:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in compare_forces_every_branch
    1. Line 14, column 8 to line 14, column 32 in compare_forces_every_branch
    2. Line 14, column 29 to line 14, column 32 in compare_forces_every_branch
    3. Line 10, column 9 to line 10, column 13 in compare_forces_every_branch
    4. Line 9, column 18 to line 9, column 74 in compare_forces_every_branch
    5. Line 9, column 32 to line 9, column 39 in compare_forces_every_branch
property:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 32 in compare_forces_every_branch
    1. Line 13, column 12 to line 13, column 36 in compare_forces_every_branch
    2. Line 13, column 33 to line 13, column 36 in compare_forces_every_branch
    3. Line 10, column 9 to line 10, column 13 in compare_forces_every_branch
    4. Line 9, column 18 to line 9, column 74 in compare_forces_every_branch
    5. Line 9, column 32 to line 9, column 39 in compare_forces_every_branch
---*)
