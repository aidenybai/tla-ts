(*---
description: "With EXTENDS Naturals a non-integer first operand of >= is reported under the name >, because Naturals.GEQ reuses that text."
ref: "tlc2/module/Naturals.java#GEQ"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE geq_naturals_message_names_greater ----
EXTENDS Naturals
Test == "a" >= 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2266:0 The first argument of > should be an integer, but instead it is:
    "a"
    2266:0 The first argument of > should be an integer, but instead it is:
    "a"
init:
  exit: 75
  transcript: |-
    2266:0 The first argument of > should be an integer, but instead it is:
    "a"
    2266:0 The first argument of > should be an integer, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in geq_naturals_message_names_greater
    1. Line 11, column 29 to line 11, column 32 in geq_naturals_message_names_greater
    2. Line 9, column 9 to line 9, column 16 in geq_naturals_message_names_greater
next:
  exit: 255
  transcript: |-
    2266:1 The first argument of > should be an integer, but instead it is:
    "a"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in geq_naturals_message_names_greater
    1. Line 12, column 30 to line 12, column 33 in geq_naturals_message_names_greater
    2. Line 9, column 9 to line 9, column 16 in geq_naturals_message_names_greater
invariant:
  exit: 75
  transcript: |-
    2266:0 The first argument of > should be an integer, but instead it is:
    "a"
    2266:0 The first argument of > should be an integer, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in geq_naturals_message_names_greater
    1. Line 13, column 8 to line 13, column 32 in geq_naturals_message_names_greater
    2. Line 13, column 29 to line 13, column 32 in geq_naturals_message_names_greater
    3. Line 9, column 9 to line 9, column 16 in geq_naturals_message_names_greater
property:
  exit: 75
  transcript: |-
    2266:0 The first argument of > should be an integer, but instead it is:
    "a"
    2266:0 The first argument of > should be an integer, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in geq_naturals_message_names_greater
    1. Line 12, column 12 to line 12, column 36 in geq_naturals_message_names_greater
    2. Line 12, column 33 to line 12, column 36 in geq_naturals_message_names_greater
    3. Line 9, column 9 to line 9, column 16 in geq_naturals_message_names_greater
---*)
