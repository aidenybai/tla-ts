(*---
description: When both sides are bad, the left one is reported.
ref: tlc2/module/Sequences.java#Concat
features:
  - Sequences
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE concat_both_bad ----
EXTENDS Sequences, Naturals
Test == 1 \o 2 = 3
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    1
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    1
init:
  exit: 75
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    1
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in concat_both_bad
    1. Line 14, column 29 to line 14, column 32 in concat_both_bad
    2. Line 12, column 9 to line 12, column 18 in concat_both_bad
    3. Line 12, column 9 to line 12, column 14 in concat_both_bad
next:
  exit: 255
  transcript: |-
    2182:1 Evaluating an expression of the form s \o t when s is not a sequence:
    1
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in concat_both_bad
    1. Line 15, column 30 to line 15, column 33 in concat_both_bad
    2. Line 12, column 9 to line 12, column 18 in concat_both_bad
    3. Line 12, column 9 to line 12, column 14 in concat_both_bad
invariant:
  exit: 75
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    1
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in concat_both_bad
    1. Line 16, column 8 to line 16, column 32 in concat_both_bad
    2. Line 16, column 29 to line 16, column 32 in concat_both_bad
    3. Line 12, column 9 to line 12, column 18 in concat_both_bad
    4. Line 12, column 9 to line 12, column 14 in concat_both_bad
property:
  exit: 75
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    1
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    1
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in concat_both_bad
    1. Line 15, column 12 to line 15, column 36 in concat_both_bad
    2. Line 15, column 33 to line 15, column 36 in concat_both_bad
    3. Line 12, column 9 to line 12, column 18 in concat_both_bad
    4. Line 12, column 9 to line 12, column 14 in concat_both_bad
---*)
