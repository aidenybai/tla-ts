(*---
description: Append's message names the form Append(s, v).
ref: tlc2/module/Sequences.java#Append
features:
  - Sequences
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE append_set ----
EXTENDS Sequences, Naturals
Test == Append({}, 1) = <<1>>
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module append_set failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {}
init:
  exit: 75
  transcript: |-
    1000:1 
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in append_set
    1. Line 14, column 29 to line 14, column 32 in append_set
    2. Line 12, column 9 to line 12, column 29 in append_set
    3. Line 12, column 9 to line 12, column 21 in append_set
next:
  exit: 255
  transcript: |-
    2182:1 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {}
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in append_set
    1. Line 15, column 30 to line 15, column 33 in append_set
    2. Line 12, column 9 to line 12, column 29 in append_set
    3. Line 12, column 9 to line 12, column 21 in append_set
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in append_set
    1. Line 16, column 8 to line 16, column 32 in append_set
    2. Line 16, column 29 to line 16, column 32 in append_set
    3. Line 12, column 9 to line 12, column 29 in append_set
    4. Line 12, column 9 to line 12, column 21 in append_set
property:
  exit: 75
  transcript: |-
    1000:1 
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    {}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in append_set
    1. Line 15, column 12 to line 15, column 36 in append_set
    2. Line 15, column 33 to line 15, column 36 in append_set
    3. Line 12, column 9 to line 12, column 29 in append_set
    4. Line 12, column 9 to line 12, column 21 in append_set
---*)
