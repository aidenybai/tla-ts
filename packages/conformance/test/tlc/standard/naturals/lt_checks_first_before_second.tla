(*---
description: When both operands of < are bad, the first is the one reported.
ref: tlc2/module/Naturals.java#LT
features:
  - Naturals
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE lt_checks_first_before_second ----
EXTENDS Naturals
Test == "a" < "b"
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module lt_checks_first_before_second failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    "a"
init:
  exit: 75
  transcript: |-
    1000:1 
    2266:0 The first argument of < should be an integer, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in lt_checks_first_before_second
    1. Line 14, column 29 to line 14, column 32 in lt_checks_first_before_second
    2. Line 12, column 9 to line 12, column 17 in lt_checks_first_before_second
next:
  exit: 255
  transcript: |-
    2266:1 The first argument of < should be an integer, but instead it is:
    "a"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in lt_checks_first_before_second
    1. Line 15, column 30 to line 15, column 33 in lt_checks_first_before_second
    2. Line 12, column 9 to line 12, column 17 in lt_checks_first_before_second
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2266:0 The first argument of < should be an integer, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in lt_checks_first_before_second
    1. Line 16, column 8 to line 16, column 32 in lt_checks_first_before_second
    2. Line 16, column 29 to line 16, column 32 in lt_checks_first_before_second
    3. Line 12, column 9 to line 12, column 17 in lt_checks_first_before_second
property:
  exit: 75
  transcript: |-
    1000:1 
    2266:0 The first argument of < should be an integer, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in lt_checks_first_before_second
    1. Line 15, column 12 to line 15, column 36 in lt_checks_first_before_second
    2. Line 15, column 33 to line 15, column 36 in lt_checks_first_before_second
    3. Line 12, column 9 to line 12, column 17 in lt_checks_first_before_second
---*)
