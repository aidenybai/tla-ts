(*---
description: "\\o reports a tuple on the left and a string on the right."
ref: "tlc2/module/Sequences.java#Concat"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE concat_tuple_with_string ----
EXTENDS Integers, Sequences
Test == <<>> \o "ab" = "ab"
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    "ab"
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    "ab"
init:
  exit: 75
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    "ab"
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    "ab"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in concat_tuple_with_string
    1. Line 11, column 29 to line 11, column 32 in concat_tuple_with_string
    2. Line 9, column 9 to line 9, column 27 in concat_tuple_with_string
    3. Line 9, column 9 to line 9, column 20 in concat_tuple_with_string
next:
  exit: 255
  transcript: |-
    2182:1 Evaluating an expression of the form t \o s when s is not a sequence:
    "ab"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in concat_tuple_with_string
    1. Line 12, column 30 to line 12, column 33 in concat_tuple_with_string
    2. Line 9, column 9 to line 9, column 27 in concat_tuple_with_string
    3. Line 9, column 9 to line 9, column 20 in concat_tuple_with_string
invariant:
  exit: 75
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    "ab"
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    "ab"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in concat_tuple_with_string
    1. Line 13, column 8 to line 13, column 32 in concat_tuple_with_string
    2. Line 13, column 29 to line 13, column 32 in concat_tuple_with_string
    3. Line 9, column 9 to line 9, column 27 in concat_tuple_with_string
    4. Line 9, column 9 to line 9, column 20 in concat_tuple_with_string
property:
  exit: 75
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    "ab"
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    "ab"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in concat_tuple_with_string
    1. Line 12, column 12 to line 12, column 36 in concat_tuple_with_string
    2. Line 12, column 33 to line 12, column 36 in concat_tuple_with_string
    3. Line 9, column 9 to line 9, column 27 in concat_tuple_with_string
    4. Line 9, column 9 to line 9, column 20 in concat_tuple_with_string
---*)
