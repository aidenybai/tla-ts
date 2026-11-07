(*---
description: A newline in the message prints as an escape, not a line break.
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
---- MODULE assert_false_multiline ----
EXTENDS TLC, Naturals
Test == Assert(FALSE, "a\nb")
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    "a\nb"
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    "a\nb"
init:
  exit: 75
  transcript: |-
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    "a\nb"
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    "a\nb"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 19, column 32 in assert_false_multiline
    1. Line 19, column 29 to line 19, column 32 in assert_false_multiline
    2. Line 17, column 9 to line 17, column 29 in assert_false_multiline
invariant:
  exit: 75
  transcript: |-
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    "a\nb"
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    "a\nb"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 19, column 32 in assert_false_multiline
    1. Line 21, column 8 to line 21, column 32 in assert_false_multiline
    2. Line 21, column 29 to line 21, column 32 in assert_false_multiline
    3. Line 17, column 9 to line 17, column 29 in assert_false_multiline
property:
  exit: 75
  transcript: |-
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    "a\nb"
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    "a\nb"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 19, column 32 in assert_false_multiline
    1. Line 20, column 12 to line 20, column 36 in assert_false_multiline
    2. Line 20, column 33 to line 20, column 36 in assert_false_multiline
    3. Line 17, column 9 to line 17, column 29 in assert_false_multiline
---*)
