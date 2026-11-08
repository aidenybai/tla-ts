(*---
description: TLCSet with a set index asks for a nonnegative integer.
ref: tlc2/module/TLCGetSet.java#TLCSet
features:
  - TLC
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE set_set_index ----
EXTENDS TLC, Naturals
Test == TLCSet({}, 0)
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module set_set_index failed.
    2169:0 The first argument of TLCSet should be a nonnegative integer, but instead it is:
    {}
init:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The first argument of TLCSet should be a nonnegative integer, but instead it is:
    {}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in set_set_index
    1. Line 14, column 29 to line 14, column 32 in set_set_index
    2. Line 12, column 9 to line 12, column 21 in set_set_index
next:
  exit: 255
  transcript: |-
    2169:1 The first argument of TLCSet should be a nonnegative integer, but instead it is:
    {}
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in set_set_index
    1. Line 15, column 30 to line 15, column 33 in set_set_index
    2. Line 12, column 9 to line 12, column 21 in set_set_index
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The first argument of TLCSet should be a nonnegative integer, but instead it is:
    {}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in set_set_index
    1. Line 16, column 8 to line 16, column 32 in set_set_index
    2. Line 16, column 29 to line 16, column 32 in set_set_index
    3. Line 12, column 9 to line 12, column 21 in set_set_index
property:
  exit: 75
  transcript: |-
    1000:1 
    2169:0 The first argument of TLCSet should be a nonnegative integer, but instead it is:
    {}
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in set_set_index
    1. Line 15, column 12 to line 15, column 36 in set_set_index
    2. Line 15, column 33 to line 15, column 36 in set_set_index
    3. Line 12, column 9 to line 12, column 21 in set_set_index
---*)
