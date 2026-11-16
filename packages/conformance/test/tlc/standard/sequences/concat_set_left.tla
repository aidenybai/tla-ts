(*---
description: A set on the left is reported.
ref: tlc2/module/Sequences.java#Concat
features:
  - Sequences
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE concat_set_left ----
EXTENDS Sequences, Naturals
Test == {} \o <<>> = {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module concat_set_left failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {}
init:
  exit: 75
  transcript: |-
    1000:1 
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in concat_set_left
    1. Line 14, column 29 to line 14, column 32 in concat_set_left
    2. Line 12, column 9 to line 12, column 23 in concat_set_left
    3. Line 12, column 9 to line 12, column 18 in concat_set_left
next:
  exit: 255
  transcript: |-
    2182:1 Evaluating an expression of the form s \o t when s is not a sequence:
    {}
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in concat_set_left
    1. Line 15, column 30 to line 15, column 33 in concat_set_left
    2. Line 12, column 9 to line 12, column 23 in concat_set_left
    3. Line 12, column 9 to line 12, column 18 in concat_set_left
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in concat_set_left
    1. Line 16, column 8 to line 16, column 32 in concat_set_left
    2. Line 16, column 29 to line 16, column 32 in concat_set_left
    3. Line 12, column 9 to line 12, column 23 in concat_set_left
    4. Line 12, column 9 to line 12, column 18 in concat_set_left
property:
  exit: 75
  transcript: |-
    1000:1 
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    {}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in concat_set_left
    1. Line 15, column 12 to line 15, column 36 in concat_set_left
    2. Line 15, column 33 to line 15, column 36 in concat_set_left
    3. Line 12, column 9 to line 12, column 23 in concat_set_left
    4. Line 12, column 9 to line 12, column 18 in concat_set_left
---*)
