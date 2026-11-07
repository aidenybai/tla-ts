(*---
description: A function on integers from 2 is no sequence or record.
ref: tlc2/module/Json.java#serialize
features:
  - Json
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE se_int_key_function ----
EXTENDS Json, TLC, Naturals
Test == JsonSerialize("out.json", [i \in {2} |-> i])
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2169:0 The second argument of JsonSerialize should be a sequence or record, but instead it is:
    (2 :> 2)
    2169:0 The second argument of JsonSerialize should be a sequence or record, but instead it is:
    (2 :> 2)
init:
  exit: 75
  transcript: |-
    2169:0 The second argument of JsonSerialize should be a sequence or record, but instead it is:
    (2 :> 2)
    2169:0 The second argument of JsonSerialize should be a sequence or record, but instead it is:
    (2 :> 2)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in se_int_key_function
    1. Line 14, column 29 to line 14, column 32 in se_int_key_function
    2. Line 12, column 9 to line 12, column 52 in se_int_key_function
next:
  exit: 255
  transcript: |-
    2169:1 The second argument of JsonSerialize should be a sequence or record, but instead it is:
    (2 :> 2)
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in se_int_key_function
    1. Line 15, column 30 to line 15, column 33 in se_int_key_function
    2. Line 12, column 9 to line 12, column 52 in se_int_key_function
invariant:
  exit: 75
  transcript: |-
    2169:0 The second argument of JsonSerialize should be a sequence or record, but instead it is:
    (2 :> 2)
    2169:0 The second argument of JsonSerialize should be a sequence or record, but instead it is:
    (2 :> 2)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in se_int_key_function
    1. Line 16, column 8 to line 16, column 32 in se_int_key_function
    2. Line 16, column 29 to line 16, column 32 in se_int_key_function
    3. Line 12, column 9 to line 12, column 52 in se_int_key_function
property:
  exit: 75
  transcript: |-
    2169:0 The second argument of JsonSerialize should be a sequence or record, but instead it is:
    (2 :> 2)
    2169:0 The second argument of JsonSerialize should be a sequence or record, but instead it is:
    (2 :> 2)
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in se_int_key_function
    1. Line 15, column 12 to line 15, column 36 in se_int_key_function
    2. Line 15, column 33 to line 15, column 36 in se_int_key_function
    3. Line 12, column 9 to line 12, column 52 in se_int_key_function
---*)
