(*---
description: Append has no string branch, so it rejects a string even with a string element.
ref: tlc2/module/Sequences.java#Append
features:
  - Sequences
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE append_string ----
EXTENDS Sequences, Naturals
Test == Append("ab", "c") = "abc"
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    "ab"
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    "ab"
init:
  exit: 75
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    "ab"
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    "ab"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in append_string
    1. Line 14, column 29 to line 14, column 32 in append_string
    2. Line 12, column 9 to line 12, column 33 in append_string
    3. Line 12, column 9 to line 12, column 25 in append_string
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
    0. Line 15, column 9 to line 15, column 33 in append_string
    1. Line 15, column 30 to line 15, column 33 in append_string
    2. Line 12, column 9 to line 12, column 33 in append_string
    3. Line 12, column 9 to line 12, column 25 in append_string
invariant:
  exit: 75
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    "ab"
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    "ab"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in append_string
    1. Line 16, column 8 to line 16, column 32 in append_string
    2. Line 16, column 29 to line 16, column 32 in append_string
    3. Line 12, column 9 to line 12, column 33 in append_string
    4. Line 12, column 9 to line 12, column 25 in append_string
property:
  exit: 75
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    "ab"
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    "ab"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in append_string
    1. Line 15, column 12 to line 15, column 36 in append_string
    2. Line 15, column 33 to line 15, column 36 in append_string
    3. Line 12, column 9 to line 12, column 33 in append_string
    4. Line 12, column 9 to line 12, column 25 in append_string
---*)
