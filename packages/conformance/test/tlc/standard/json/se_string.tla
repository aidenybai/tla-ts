(*---
description: A string is no sequence or record.
ref: tlc2/module/Json.java#serialize
features:
  - Json
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE se_string ----
EXTENDS Json, TLC, Naturals
Test == JsonSerialize("out.json", "a")
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module se_string failed.
    2169:0 The second argument of JsonSerialize should be a sequence or record, but instead it is:
    "a"
init:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of JsonSerialize should be a sequence or record, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in se_string
    1. Line 14, column 29 to line 14, column 32 in se_string
    2. Line 12, column 9 to line 12, column 38 in se_string
next:
  exit: 255
  transcript: |-
    2169:1 The second argument of JsonSerialize should be a sequence or record, but instead it is:
    "a"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in se_string
    1. Line 15, column 30 to line 15, column 33 in se_string
    2. Line 12, column 9 to line 12, column 38 in se_string
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of JsonSerialize should be a sequence or record, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in se_string
    1. Line 16, column 8 to line 16, column 32 in se_string
    2. Line 16, column 29 to line 16, column 32 in se_string
    3. Line 12, column 9 to line 12, column 38 in se_string
property:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The second argument of JsonSerialize should be a sequence or record, but instead it is:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in se_string
    1. Line 15, column 12 to line 15, column 36 in se_string
    2. Line 15, column 33 to line 15, column 36 in se_string
    3. Line 12, column 9 to line 12, column 38 in se_string
---*)
