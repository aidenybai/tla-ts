(*---
description: A tuple message prints as a tuple.
ref: tlc2/module/TLC.java#Assert
features:
  - TLC
flags:
  - expression
contexts:
  - assume
  - init
  - invariant
  - property
outcome: evaluation-failure
---*)
---- MODULE assert_false_tuple ----
EXTENDS TLC, Naturals
Test == Assert(FALSE, <<1, "x">>)
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    <<1, "x">>
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    <<1, "x">>
init:
  exit: 75
  transcript: |-
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    <<1, "x">>
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    <<1, "x">>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 19, column 32 in assert_false_tuple
    1. Line 19, column 29 to line 19, column 32 in assert_false_tuple
    2. Line 17, column 9 to line 17, column 33 in assert_false_tuple
invariant:
  exit: 75
  transcript: |-
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    <<1, "x">>
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    <<1, "x">>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 19, column 32 in assert_false_tuple
    1. Line 21, column 8 to line 21, column 32 in assert_false_tuple
    2. Line 21, column 29 to line 21, column 32 in assert_false_tuple
    3. Line 17, column 9 to line 17, column 33 in assert_false_tuple
property:
  exit: 75
  transcript: |-
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    <<1, "x">>
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    <<1, "x">>
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 19, column 32 in assert_false_tuple
    1. Line 20, column 12 to line 20, column 36 in assert_false_tuple
    2. Line 20, column 33 to line 20, column 36 in assert_false_tuple
    3. Line 17, column 9 to line 17, column 33 in assert_false_tuple
---*)
