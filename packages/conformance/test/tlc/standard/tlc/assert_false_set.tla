(*---
description: A set message prints normalized.
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
---- MODULE assert_false_set ----
EXTENDS TLC, Naturals
Test == Assert(FALSE, {2, 1})
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module assert_false_set failed.
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    {1, 2}
init:
  exit: 75
  transcript: |-
    1000:1 
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    {1, 2}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 19, column 32 in assert_false_set
    1. Line 19, column 29 to line 19, column 32 in assert_false_set
    2. Line 17, column 9 to line 17, column 29 in assert_false_set
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    {1, 2}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 19, column 32 in assert_false_set
    1. Line 21, column 8 to line 21, column 32 in assert_false_set
    2. Line 21, column 29 to line 21, column 32 in assert_false_set
    3. Line 17, column 9 to line 17, column 29 in assert_false_set
property:
  exit: 75
  transcript: |-
    1000:1 
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    {1, 2}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 19, column 32 in assert_false_set
    1. Line 20, column 12 to line 20, column 36 in assert_false_set
    2. Line 20, column 33 to line 20, column 36 in assert_false_set
    3. Line 17, column 9 to line 17, column 29 in assert_false_set
---*)
