(*---
description: "Append has no string case."
ref: "tlc2/module/Sequences.java#Append"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE append_not_supported ----
EXTENDS Integers, Sequences
Test == Append("ab", "c") = "abc"
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module append_not_supported failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    "ab"
init:
  exit: 75
  transcript: |-
    1000:1 
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    "ab"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in append_not_supported
    1. Line 11, column 29 to line 11, column 32 in append_not_supported
    2. Line 9, column 9 to line 9, column 33 in append_not_supported
    3. Line 9, column 9 to line 9, column 25 in append_not_supported
next:
  exit: 255
  transcript: |-
    2182:1 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    "ab"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in append_not_supported
    1. Line 12, column 30 to line 12, column 33 in append_not_supported
    2. Line 9, column 9 to line 9, column 33 in append_not_supported
    3. Line 9, column 9 to line 9, column 25 in append_not_supported
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    "ab"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in append_not_supported
    1. Line 13, column 8 to line 13, column 32 in append_not_supported
    2. Line 13, column 29 to line 13, column 32 in append_not_supported
    3. Line 9, column 9 to line 9, column 33 in append_not_supported
    4. Line 9, column 9 to line 9, column 25 in append_not_supported
property:
  exit: 75
  transcript: |-
    1000:1 
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    "ab"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in append_not_supported
    1. Line 12, column 12 to line 12, column 36 in append_not_supported
    2. Line 12, column 33 to line 12, column 36 in append_not_supported
    3. Line 9, column 9 to line 9, column 33 in append_not_supported
    4. Line 9, column 9 to line 9, column 25 in append_not_supported
---*)
