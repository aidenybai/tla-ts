(*---
description: Extending Naturals, then Integers loads both classes, and Integers' >= message wins because Integers overrides the shared definition.
ref: tlc2/tool/impl/SpecProcessor.java#processModuleOverrides
features:
  - Integers
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE extends_both_naturals_first_geq ----
EXTENDS Naturals, Integers
Test == "a" >= 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2266:0 The first argument of >= should be an integer, but instead it is:
    "a"
    2266:0 The first argument of >= should be an integer, but instead it is:
    "a"
init:
  exit: 75
  transcript: |-
    2266:0 The first argument of >= should be an integer, but instead it is:
    "a"
    2266:0 The first argument of >= should be an integer, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in extends_both_naturals_first_geq
    1. Line 14, column 29 to line 14, column 32 in extends_both_naturals_first_geq
    2. Line 12, column 9 to line 12, column 16 in extends_both_naturals_first_geq
next:
  exit: 255
  transcript: |-
    2266:1 The first argument of >= should be an integer, but instead it is:
    "a"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in extends_both_naturals_first_geq
    1. Line 15, column 30 to line 15, column 33 in extends_both_naturals_first_geq
    2. Line 12, column 9 to line 12, column 16 in extends_both_naturals_first_geq
invariant:
  exit: 75
  transcript: |-
    2266:0 The first argument of >= should be an integer, but instead it is:
    "a"
    2266:0 The first argument of >= should be an integer, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in extends_both_naturals_first_geq
    1. Line 16, column 8 to line 16, column 32 in extends_both_naturals_first_geq
    2. Line 16, column 29 to line 16, column 32 in extends_both_naturals_first_geq
    3. Line 12, column 9 to line 12, column 16 in extends_both_naturals_first_geq
property:
  exit: 75
  transcript: |-
    2266:0 The first argument of >= should be an integer, but instead it is:
    "a"
    2266:0 The first argument of >= should be an integer, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in extends_both_naturals_first_geq
    1. Line 15, column 12 to line 15, column 36 in extends_both_naturals_first_geq
    2. Line 15, column 33 to line 15, column 36 in extends_both_naturals_first_geq
    3. Line 12, column 9 to line 12, column 16 in extends_both_naturals_first_geq
---*)
