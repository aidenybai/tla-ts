(*---
description: A tuple is not a set.
ref: tlc2/module/TLC.java#RandomElement
features:
  - TLC
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE random_tuple ----
EXTENDS TLC, Naturals
Test == RandomElement(<<1>>) = 1
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    <<1>>
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    <<1>>
init:
  exit: 75
  transcript: |-
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    <<1>>
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    <<1>>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in random_tuple
    1. Line 14, column 29 to line 14, column 32 in random_tuple
    2. Line 12, column 9 to line 12, column 32 in random_tuple
    3. Line 12, column 9 to line 12, column 28 in random_tuple
next:
  exit: 255
  transcript: |-
    2176:1 Applying RandomElement to the following value,
    which is not a finite set:
    <<1>>
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in random_tuple
    1. Line 15, column 30 to line 15, column 33 in random_tuple
    2. Line 12, column 9 to line 12, column 32 in random_tuple
    3. Line 12, column 9 to line 12, column 28 in random_tuple
invariant:
  exit: 75
  transcript: |-
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    <<1>>
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    <<1>>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in random_tuple
    1. Line 16, column 8 to line 16, column 32 in random_tuple
    2. Line 16, column 29 to line 16, column 32 in random_tuple
    3. Line 12, column 9 to line 12, column 32 in random_tuple
    4. Line 12, column 9 to line 12, column 28 in random_tuple
property:
  exit: 75
  transcript: |-
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    <<1>>
    2176:0 Applying RandomElement to the following value,
    which is not a finite set:
    <<1>>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in random_tuple
    1. Line 15, column 12 to line 15, column 36 in random_tuple
    2. Line 15, column 33 to line 15, column 36 in random_tuple
    3. Line 12, column 9 to line 12, column 32 in random_tuple
    4. Line 12, column 9 to line 12, column 28 in random_tuple
---*)
