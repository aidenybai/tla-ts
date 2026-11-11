(*---
description: A set operand of < prints the set in the message.
ref: tlc2/module/Naturals.java#LT
features:
  - Naturals
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE lt_set ----
EXTENDS Naturals
Test == {1, 2} < 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module lt_set failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    {1, 2}
init:
  exit: 75
  transcript: |-
    1000:1 
    2266:0 The first argument of < should be an integer, but instead it is:
    {1, 2}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in lt_set
    1. Line 14, column 29 to line 14, column 32 in lt_set
    2. Line 12, column 9 to line 12, column 18 in lt_set
next:
  exit: 255
  transcript: |-
    2266:1 The first argument of < should be an integer, but instead it is:
    {1, 2}
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in lt_set
    1. Line 15, column 30 to line 15, column 33 in lt_set
    2. Line 12, column 9 to line 12, column 18 in lt_set
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2266:0 The first argument of < should be an integer, but instead it is:
    {1, 2}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in lt_set
    1. Line 16, column 8 to line 16, column 32 in lt_set
    2. Line 16, column 29 to line 16, column 32 in lt_set
    3. Line 12, column 9 to line 12, column 18 in lt_set
property:
  exit: 75
  transcript: |-
    1000:1 
    2266:0 The first argument of < should be an integer, but instead it is:
    {1, 2}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in lt_set
    1. Line 15, column 12 to line 15, column 36 in lt_set
    2. Line 15, column 33 to line 15, column 36 in lt_set
    3. Line 12, column 9 to line 12, column 18 in lt_set
---*)
