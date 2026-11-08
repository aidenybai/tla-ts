(*---
description: A model value is not an integer to <, even though it compares with anything under =.
ref: tlc2/module/Naturals.java#LT
features:
  - Naturals
flags:
  - expression
outcome: evaluation-failure
config: |
  CONSTANT mv = mv
---*)
---- MODULE lt_model_value ----
EXTENDS Naturals
CONSTANT mv
Test == mv < 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 16, col 8 to line 16, col 11 of module lt_model_value failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    mv
init:
  exit: 75
  transcript: |-
    1000:1 
    2266:0 The first argument of < should be an integer, but instead it is:
    mv
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 32 in lt_model_value
    1. Line 17, column 29 to line 17, column 32 in lt_model_value
    2. Line 15, column 9 to line 15, column 14 in lt_model_value
next:
  exit: 255
  transcript: |-
    2266:1 The first argument of < should be an integer, but instead it is:
    mv
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 18, column 9 to line 18, column 33 in lt_model_value
    1. Line 18, column 30 to line 18, column 33 in lt_model_value
    2. Line 15, column 9 to line 15, column 14 in lt_model_value
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2266:0 The first argument of < should be an integer, but instead it is:
    mv
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 32 in lt_model_value
    1. Line 19, column 8 to line 19, column 32 in lt_model_value
    2. Line 19, column 29 to line 19, column 32 in lt_model_value
    3. Line 15, column 9 to line 15, column 14 in lt_model_value
property:
  exit: 75
  transcript: |-
    1000:1 
    2266:0 The first argument of < should be an integer, but instead it is:
    mv
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 32 in lt_model_value
    1. Line 18, column 12 to line 18, column 36 in lt_model_value
    2. Line 18, column 33 to line 18, column 36 in lt_model_value
    3. Line 15, column 9 to line 15, column 14 in lt_model_value
---*)
