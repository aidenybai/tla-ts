(*---
description: "\\o rejects a string and a tuple, even an empty one."
ref: "tlc2/module/Sequences.java#Concat"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE concat_string_with_tuple ----
EXTENDS Integers, Sequences
Test == "ab" \o <<>> = "ab"
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module concat_string_with_tuple failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a string:
    <<>>
init:
  exit: 75
  transcript: |-
    1000:1 
    2182:0 Evaluating an expression of the form t \o s when s is not a string:
    <<>>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in concat_string_with_tuple
    1. Line 11, column 29 to line 11, column 32 in concat_string_with_tuple
    2. Line 9, column 9 to line 9, column 27 in concat_string_with_tuple
    3. Line 9, column 9 to line 9, column 20 in concat_string_with_tuple
next:
  exit: 255
  transcript: |-
    2182:1 Evaluating an expression of the form t \o s when s is not a string:
    <<>>
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in concat_string_with_tuple
    1. Line 12, column 30 to line 12, column 33 in concat_string_with_tuple
    2. Line 9, column 9 to line 9, column 27 in concat_string_with_tuple
    3. Line 9, column 9 to line 9, column 20 in concat_string_with_tuple
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2182:0 Evaluating an expression of the form t \o s when s is not a string:
    <<>>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in concat_string_with_tuple
    1. Line 13, column 8 to line 13, column 32 in concat_string_with_tuple
    2. Line 13, column 29 to line 13, column 32 in concat_string_with_tuple
    3. Line 9, column 9 to line 9, column 27 in concat_string_with_tuple
    4. Line 9, column 9 to line 9, column 20 in concat_string_with_tuple
property:
  exit: 75
  transcript: |-
    1000:1 
    2182:0 Evaluating an expression of the form t \o s when s is not a string:
    <<>>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in concat_string_with_tuple
    1. Line 12, column 12 to line 12, column 36 in concat_string_with_tuple
    2. Line 12, column 33 to line 12, column 36 in concat_string_with_tuple
    3. Line 9, column 9 to line 9, column 27 in concat_string_with_tuple
    4. Line 9, column 9 to line 9, column 20 in concat_string_with_tuple
---*)
