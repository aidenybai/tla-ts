(*---
description: A non-string file name names ndJsonSerialize and sequence, though it wants a string.
ref: tlc2/module/Json.java#textSerialize
features:
  - Json
flags:
  - expression
outcome: evaluation-failure
includes:
  - IOUtils.tla
---*)
---- MODULE text_second_non_string ----
EXTENDS Json, IOUtils, TLC, Naturals
Test == Serialize(<<1>>, 3, [format |-> "NDJSON", charset |-> "UTF-8", openOptions |-> <<"WRITE", "CREATE", "TRUNCATE_EXISTING">>])
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2169:0 The second argument of ndJsonSerialize should be a sequence, but instead it is:
    3
    2169:0 The second argument of ndJsonSerialize should be a sequence, but instead it is:
    3
    2169:0 The second argument of ndJsonSerialize should be a sequence, but instead it is:
    3
init:
  exit: 75
  transcript: |-
    2169:0 The second argument of ndJsonSerialize should be a sequence, but instead it is:
    3
    2169:0 The second argument of ndJsonSerialize should be a sequence, but instead it is:
    3
    2169:0 The second argument of ndJsonSerialize should be a sequence, but instead it is:
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in text_second_non_string
    1. Line 16, column 29 to line 16, column 32 in text_second_non_string
    2. Line 14, column 9 to line 14, column 131 in text_second_non_string
next:
  exit: 75
  transcript: |-
    2169:0 The second argument of ndJsonSerialize should be a sequence, but instead it is:
    3
    2169:0 The second argument of ndJsonSerialize should be a sequence, but instead it is:
    3
    2169:0 The second argument of ndJsonSerialize should be a sequence, but instead it is:
    3
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 33 in text_second_non_string
    1. Line 17, column 30 to line 17, column 33 in text_second_non_string
    2. Line 14, column 9 to line 14, column 131 in text_second_non_string
invariant:
  exit: 75
  transcript: |-
    2169:0 The second argument of ndJsonSerialize should be a sequence, but instead it is:
    3
    2169:0 The second argument of ndJsonSerialize should be a sequence, but instead it is:
    3
    | While working on the initial state:
    | conformance_state = TRUE
    2169:0 The second argument of ndJsonSerialize should be a sequence, but instead it is:
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in text_second_non_string
    1. Line 18, column 8 to line 18, column 32 in text_second_non_string
    2. Line 18, column 29 to line 18, column 32 in text_second_non_string
    3. Line 14, column 9 to line 14, column 131 in text_second_non_string
property:
  exit: 75
  transcript: |-
    2169:0 The second argument of ndJsonSerialize should be a sequence, but instead it is:
    3
    2169:0 The second argument of ndJsonSerialize should be a sequence, but instead it is:
    3
    | While working on the initial state:
    | conformance_state = TRUE
    2169:0 The second argument of ndJsonSerialize should be a sequence, but instead it is:
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in text_second_non_string
    1. Line 17, column 12 to line 17, column 36 in text_second_non_string
    2. Line 17, column 33 to line 17, column 36 in text_second_non_string
    3. Line 14, column 9 to line 14, column 131 in text_second_non_string
---*)
