(*---
description: A record with the right fields is not a CounterExample.
ref: tlc2/module/TLCExt.java#lassoOrdinal
features:
  - TLCExt
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE to_trace_lookalike_record ----
EXTENDS TLCExt, TLC, Naturals
Test == ToTrace([state |-> {}, action |-> {}]) = <<>>
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module to_trace_lookalike_record failed.
    2283:0 The argument of ToTrace should be a CounterExample, but instead it is:
    [state |-> {}, action |-> {}]
init:
  exit: 75
  transcript: |-
    1000:1 
    2283:0 The argument of ToTrace should be a CounterExample, but instead it is:
    [state |-> {}, action |-> {}]
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in to_trace_lookalike_record
    1. Line 14, column 29 to line 14, column 32 in to_trace_lookalike_record
    2. Line 12, column 9 to line 12, column 53 in to_trace_lookalike_record
    3. Line 12, column 9 to line 12, column 46 in to_trace_lookalike_record
next:
  exit: 255
  transcript: |-
    2283:1 The argument of ToTrace should be a CounterExample, but instead it is:
    [state |-> {}, action |-> {}]
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in to_trace_lookalike_record
    1. Line 15, column 30 to line 15, column 33 in to_trace_lookalike_record
    2. Line 12, column 9 to line 12, column 53 in to_trace_lookalike_record
    3. Line 12, column 9 to line 12, column 46 in to_trace_lookalike_record
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2283:0 The argument of ToTrace should be a CounterExample, but instead it is:
    [state |-> {}, action |-> {}]
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in to_trace_lookalike_record
    1. Line 16, column 8 to line 16, column 32 in to_trace_lookalike_record
    2. Line 16, column 29 to line 16, column 32 in to_trace_lookalike_record
    3. Line 12, column 9 to line 12, column 53 in to_trace_lookalike_record
    4. Line 12, column 9 to line 12, column 46 in to_trace_lookalike_record
property:
  exit: 75
  transcript: |-
    1000:1 
    2283:0 The argument of ToTrace should be a CounterExample, but instead it is:
    [state |-> {}, action |-> {}]
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in to_trace_lookalike_record
    1. Line 15, column 12 to line 15, column 36 in to_trace_lookalike_record
    2. Line 15, column 33 to line 15, column 36 in to_trace_lookalike_record
    3. Line 12, column 9 to line 12, column 53 in to_trace_lookalike_record
    4. Line 12, column 9 to line 12, column 46 in to_trace_lookalike_record
---*)
