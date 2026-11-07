(*---
description: A record message prints as a record.
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
---- MODULE assert_false_record ----
EXTENDS TLC, Naturals
Test == Assert(FALSE, [a |-> 1])
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    [a |-> 1]
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    [a |-> 1]
init:
  exit: 75
  transcript: |-
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    [a |-> 1]
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    [a |-> 1]
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 19, column 32 in assert_false_record
    1. Line 19, column 29 to line 19, column 32 in assert_false_record
    2. Line 17, column 9 to line 17, column 32 in assert_false_record
invariant:
  exit: 75
  transcript: |-
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    [a |-> 1]
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    [a |-> 1]
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 19, column 32 in assert_false_record
    1. Line 21, column 8 to line 21, column 32 in assert_false_record
    2. Line 21, column 29 to line 21, column 32 in assert_false_record
    3. Line 17, column 9 to line 17, column 32 in assert_false_record
property:
  exit: 75
  transcript: |-
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    [a |-> 1]
    2132:0 The first argument of Assert evaluated to FALSE; the second argument was:
    [a |-> 1]
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 19, column 9 to line 19, column 32 in assert_false_record
    1. Line 20, column 12 to line 20, column 36 in assert_false_record
    2. Line 20, column 33 to line 20, column 36 in assert_false_record
    3. Line 17, column 9 to line 17, column 32 in assert_false_record
---*)
