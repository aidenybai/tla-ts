(*---
description: "< does not accept a model value, unlike =."
ref: "tlc2/module/Integers.java#LT"
flags: [expression]
outcome: evaluation-failure
config: |
  CONSTANT mv = mv
---*)
---- MODULE less_with_model_value ----
EXTENDS Integers
CONSTANT mv
Test == mv < 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module less_with_model_value failed.
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
    0. Line 14, column 9 to line 14, column 32 in less_with_model_value
    1. Line 14, column 29 to line 14, column 32 in less_with_model_value
    2. Line 12, column 9 to line 12, column 14 in less_with_model_value
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
    0. Line 15, column 9 to line 15, column 33 in less_with_model_value
    1. Line 15, column 30 to line 15, column 33 in less_with_model_value
    2. Line 12, column 9 to line 12, column 14 in less_with_model_value
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2266:0 The first argument of < should be an integer, but instead it is:
    mv
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in less_with_model_value
    1. Line 16, column 8 to line 16, column 32 in less_with_model_value
    2. Line 16, column 29 to line 16, column 32 in less_with_model_value
    3. Line 12, column 9 to line 12, column 14 in less_with_model_value
property:
  exit: 75
  transcript: |-
    1000:1 
    2266:0 The first argument of < should be an integer, but instead it is:
    mv
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in less_with_model_value
    1. Line 15, column 12 to line 15, column 36 in less_with_model_value
    2. Line 15, column 33 to line 15, column 36 in less_with_model_value
    3. Line 12, column 9 to line 12, column 14 in less_with_model_value
---*)
