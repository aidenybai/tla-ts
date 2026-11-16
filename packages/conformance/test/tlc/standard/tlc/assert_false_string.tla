(*---
description: A FALSE Assert prints the string message with its quotes.
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
---- MODULE assert_false_string ----
EXTENDS TLC, Naturals
Test == Assert(FALSE, "boom")
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module assert_false_string failed.
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    "boom"
init:
  exit: 75
  transcript: |-
    1000:1 
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    "boom"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 19, column 32 in assert_false_string
    1. Line 19, column 29 to line 19, column 32 in assert_false_string
    2. Line 17, column 9 to line 17, column 29 in assert_false_string
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    "boom"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 19, column 32 in assert_false_string
    1. Line 21, column 8 to line 21, column 32 in assert_false_string
    2. Line 21, column 29 to line 21, column 32 in assert_false_string
    3. Line 17, column 9 to line 17, column 29 in assert_false_string
property:
  exit: 75
  transcript: |-
    1000:1 
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    "boom"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 19, column 32 in assert_false_string
    1. Line 20, column 12 to line 20, column 36 in assert_false_string
    2. Line 20, column 33 to line 20, column 36 in assert_false_string
    3. Line 17, column 9 to line 17, column 29 in assert_false_string
---*)
