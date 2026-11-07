(*---
description: A string key TLCSet rejects fails after the read.
ref: tla2sany/StandardModules/TLCExt.tla
features:
  - TLCExt
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE get_and_set_unknown_key ----
EXTENDS TLCExt, TLC, Naturals
Test == TLCGetAndSet("foo", +, 1, 0) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2169:0 The first argument of TLCSet should be a nonnegative integer, but instead it is:
    "foo"
    2169:0 The first argument of TLCSet should be a nonnegative integer, but instead it is:
    "foo"
init:
  exit: 75
  transcript: |-
    2169:0 The first argument of TLCSet should be a nonnegative integer, but instead it is:
    "foo"
    2169:0 The first argument of TLCSet should be a nonnegative integer, but instead it is:
    "foo"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in get_and_set_unknown_key
    1. Line 14, column 29 to line 14, column 32 in get_and_set_unknown_key
    2. Line 12, column 9 to line 12, column 40 in get_and_set_unknown_key
    3. Line 12, column 9 to line 12, column 36 in get_and_set_unknown_key
    4. Line 34, column 3 to line 35, column 57 in TLCExt
    5. Line 35, column 6 to line 35, column 57 in TLCExt
    6. Line 35, column 30 to line 35, column 57 in TLCExt
next:
  exit: 255
  transcript: |-
    2169:1 The first argument of TLCSet should be a nonnegative integer, but instead it is:
    "foo"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in get_and_set_unknown_key
    1. Line 15, column 30 to line 15, column 33 in get_and_set_unknown_key
    2. Line 12, column 9 to line 12, column 40 in get_and_set_unknown_key
    3. Line 12, column 9 to line 12, column 36 in get_and_set_unknown_key
    4. Line 34, column 3 to line 35, column 57 in TLCExt
    5. Line 35, column 6 to line 35, column 57 in TLCExt
    6. Line 35, column 30 to line 35, column 57 in TLCExt
invariant:
  exit: 75
  transcript: |-
    2169:0 The first argument of TLCSet should be a nonnegative integer, but instead it is:
    "foo"
    2169:0 The first argument of TLCSet should be a nonnegative integer, but instead it is:
    "foo"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in get_and_set_unknown_key
    1. Line 16, column 8 to line 16, column 32 in get_and_set_unknown_key
    2. Line 16, column 29 to line 16, column 32 in get_and_set_unknown_key
    3. Line 12, column 9 to line 12, column 40 in get_and_set_unknown_key
    4. Line 12, column 9 to line 12, column 36 in get_and_set_unknown_key
    5. Line 34, column 3 to line 35, column 57 in TLCExt
    6. Line 35, column 6 to line 35, column 57 in TLCExt
    7. Line 35, column 30 to line 35, column 57 in TLCExt
property:
  exit: 75
  transcript: |-
    2169:0 The first argument of TLCSet should be a nonnegative integer, but instead it is:
    "foo"
    2169:0 The first argument of TLCSet should be a nonnegative integer, but instead it is:
    "foo"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in get_and_set_unknown_key
    1. Line 15, column 12 to line 15, column 36 in get_and_set_unknown_key
    2. Line 15, column 33 to line 15, column 36 in get_and_set_unknown_key
    3. Line 12, column 9 to line 12, column 40 in get_and_set_unknown_key
    4. Line 12, column 9 to line 12, column 36 in get_and_set_unknown_key
    5. Line 34, column 3 to line 35, column 57 in TLCExt
    6. Line 35, column 6 to line 35, column 57 in TLCExt
    7. Line 35, column 30 to line 35, column 57 in TLCExt
---*)
