(*---
description: Integers.Times delegates to Naturals.Times.
ref: tlc2/module/Integers.java#Times
features:
  - Integers
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE times_overflow_delegates ----
EXTENDS Integers
Test == (-65536) * 32769 = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module times_overflow_delegates failed.
    2178:0 Overflow when computing -65536*32769
init:
  exit: 75
  transcript: |-
    1000:1 
    2178:0 Overflow when computing -65536*32769
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in times_overflow_delegates
    1. Line 14, column 29 to line 14, column 32 in times_overflow_delegates
    2. Line 12, column 9 to line 12, column 28 in times_overflow_delegates
    3. Line 12, column 9 to line 12, column 24 in times_overflow_delegates
next:
  exit: 255
  transcript: |-
    2178:1 Overflow when computing -65536*32769
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in times_overflow_delegates
    1. Line 15, column 30 to line 15, column 33 in times_overflow_delegates
    2. Line 12, column 9 to line 12, column 28 in times_overflow_delegates
    3. Line 12, column 9 to line 12, column 24 in times_overflow_delegates
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2178:0 Overflow when computing -65536*32769
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in times_overflow_delegates
    1. Line 16, column 8 to line 16, column 32 in times_overflow_delegates
    2. Line 16, column 29 to line 16, column 32 in times_overflow_delegates
    3. Line 12, column 9 to line 12, column 28 in times_overflow_delegates
    4. Line 12, column 9 to line 12, column 24 in times_overflow_delegates
property:
  exit: 75
  transcript: |-
    1000:1 
    2178:0 Overflow when computing -65536*32769
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in times_overflow_delegates
    1. Line 15, column 12 to line 15, column 36 in times_overflow_delegates
    2. Line 15, column 33 to line 15, column 36 in times_overflow_delegates
    3. Line 12, column 9 to line 12, column 28 in times_overflow_delegates
    4. Line 12, column 9 to line 12, column 24 in times_overflow_delegates
---*)
