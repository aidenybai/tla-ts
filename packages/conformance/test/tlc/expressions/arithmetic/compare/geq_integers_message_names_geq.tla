(*---
description: "With EXTENDS Integers the same operand is reported under the name >=."
ref: "tlc2/module/Integers.java#GEQ"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE geq_integers_message_names_geq ----
EXTENDS Integers
Test == "a" >= 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2266:0 The first argument of >= should be an integer, but instead it is:
    "a"
    2266:0 The first argument of >= should be an integer, but instead it is:
    "a"
init:
  exit: 75
  transcript: |-
    2266:0 The first argument of >= should be an integer, but instead it is:
    "a"
    2266:0 The first argument of >= should be an integer, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in geq_integers_message_names_geq
    1. Line 11, column 29 to line 11, column 32 in geq_integers_message_names_geq
    2. Line 9, column 9 to line 9, column 16 in geq_integers_message_names_geq
next:
  exit: 255
  transcript: |-
    2266:1 The first argument of >= should be an integer, but instead it is:
    "a"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in geq_integers_message_names_geq
    1. Line 12, column 30 to line 12, column 33 in geq_integers_message_names_geq
    2. Line 9, column 9 to line 9, column 16 in geq_integers_message_names_geq
invariant:
  exit: 75
  transcript: |-
    2266:0 The first argument of >= should be an integer, but instead it is:
    "a"
    2266:0 The first argument of >= should be an integer, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in geq_integers_message_names_geq
    1. Line 13, column 8 to line 13, column 32 in geq_integers_message_names_geq
    2. Line 13, column 29 to line 13, column 32 in geq_integers_message_names_geq
    3. Line 9, column 9 to line 9, column 16 in geq_integers_message_names_geq
property:
  exit: 75
  transcript: |-
    2266:0 The first argument of >= should be an integer, but instead it is:
    "a"
    2266:0 The first argument of >= should be an integer, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in geq_integers_message_names_geq
    1. Line 12, column 12 to line 12, column 36 in geq_integers_message_names_geq
    2. Line 12, column 33 to line 12, column 36 in geq_integers_message_names_geq
    3. Line 9, column 9 to line 9, column 16 in geq_integers_message_names_geq
---*)
