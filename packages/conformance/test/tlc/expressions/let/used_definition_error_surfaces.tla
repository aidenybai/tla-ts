(*---
description: "A LET definition that the body reaches reports its error."
ref: "tlc2/tool/impl/Tool.java#evalImplLetInKind"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE used_definition_error_surfaces ----
EXTENDS Integers
Test == LET a == 1 \div 0 IN a = 1
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
    0. Line 11, column 9 to line 11, column 32 in used_definition_error_surfaces
    1. Line 11, column 29 to line 11, column 32 in used_definition_error_surfaces
    2. Line 9, column 9 to line 9, column 34 in used_definition_error_surfaces
    3. Line 9, column 30 to line 9, column 34 in used_definition_error_surfaces
    4. Line 9, column 30 to line 9, column 30 in used_definition_error_surfaces
    5. Line 9, column 18 to line 9, column 25 in used_definition_error_surfaces
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in used_definition_error_surfaces
    1. Line 12, column 30 to line 12, column 33 in used_definition_error_surfaces
    2. Line 9, column 9 to line 9, column 34 in used_definition_error_surfaces
    3. Line 9, column 30 to line 9, column 34 in used_definition_error_surfaces
    4. Line 9, column 30 to line 9, column 30 in used_definition_error_surfaces
    5. Line 9, column 18 to line 9, column 25 in used_definition_error_surfaces
invariant:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in used_definition_error_surfaces
    1. Line 13, column 8 to line 13, column 32 in used_definition_error_surfaces
    2. Line 13, column 29 to line 13, column 32 in used_definition_error_surfaces
    3. Line 9, column 9 to line 9, column 34 in used_definition_error_surfaces
    4. Line 9, column 30 to line 9, column 34 in used_definition_error_surfaces
    5. Line 9, column 30 to line 9, column 30 in used_definition_error_surfaces
    6. Line 9, column 18 to line 9, column 25 in used_definition_error_surfaces
property:
  exit: 75
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in used_definition_error_surfaces
    1. Line 12, column 12 to line 12, column 36 in used_definition_error_surfaces
    2. Line 12, column 33 to line 12, column 36 in used_definition_error_surfaces
    3. Line 9, column 9 to line 9, column 34 in used_definition_error_surfaces
    4. Line 9, column 30 to line 9, column 34 in used_definition_error_surfaces
    5. Line 9, column 30 to line 9, column 30 in used_definition_error_surfaces
    6. Line 9, column 18 to line 9, column 25 in used_definition_error_surfaces
---*)
