(*---
description: ToTrace of an integer names CounterExample in its message.
ref: tlc2/module/TLCExt.java#lassoOrdinal
features:
  - TLCExt
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE to_trace_int ----
EXTENDS TLCExt, TLC, Naturals
Test == ToTrace(3) = <<>>
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2283:0 The argument of ToTrace should be a CounterExample, but instead it is:
    3
    2283:0 The argument of ToTrace should be a CounterExample, but instead it is:
    3
init:
  exit: 75
  transcript: |-
    2283:0 The argument of ToTrace should be a CounterExample, but instead it is:
    3
    2283:0 The argument of ToTrace should be a CounterExample, but instead it is:
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in to_trace_int
    1. Line 14, column 29 to line 14, column 32 in to_trace_int
    2. Line 12, column 9 to line 12, column 25 in to_trace_int
    3. Line 12, column 9 to line 12, column 18 in to_trace_int
next:
  exit: 255
  transcript: |-
    2283:1 The argument of ToTrace should be a CounterExample, but instead it is:
    3
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in to_trace_int
    1. Line 15, column 30 to line 15, column 33 in to_trace_int
    2. Line 12, column 9 to line 12, column 25 in to_trace_int
    3. Line 12, column 9 to line 12, column 18 in to_trace_int
invariant:
  exit: 75
  transcript: |-
    2283:0 The argument of ToTrace should be a CounterExample, but instead it is:
    3
    2283:0 The argument of ToTrace should be a CounterExample, but instead it is:
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in to_trace_int
    1. Line 16, column 8 to line 16, column 32 in to_trace_int
    2. Line 16, column 29 to line 16, column 32 in to_trace_int
    3. Line 12, column 9 to line 12, column 25 in to_trace_int
    4. Line 12, column 9 to line 12, column 18 in to_trace_int
property:
  exit: 75
  transcript: |-
    2283:0 The argument of ToTrace should be a CounterExample, but instead it is:
    3
    2283:0 The argument of ToTrace should be a CounterExample, but instead it is:
    3
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in to_trace_int
    1. Line 15, column 12 to line 15, column 36 in to_trace_int
    2. Line 15, column 33 to line 15, column 36 in to_trace_int
    3. Line 12, column 9 to line 12, column 25 in to_trace_int
    4. Line 12, column 9 to line 12, column 18 in to_trace_int
---*)
