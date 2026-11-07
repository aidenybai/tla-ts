(*---
description: A record set past the integer range fails its size check.
ref: tlc2/value/impl/SetOfRcdsValue.java#size
features:
  - FiniteSets
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE card_record_set_too_big ----
EXTENDS FiniteSets, Naturals
Test == Cardinality([a : 1..65536, b : 1..65536]) = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
init:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in card_record_set_too_big
    1. Line 14, column 29 to line 14, column 32 in card_record_set_too_big
    2. Line 12, column 9 to line 12, column 53 in card_record_set_too_big
    3. Line 12, column 9 to line 12, column 49 in card_record_set_too_big
next:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 15, column 9 to line 15, column 33 in card_record_set_too_big
    1. Line 15, column 30 to line 15, column 33 in card_record_set_too_big
    2. Line 12, column 9 to line 12, column 53 in card_record_set_too_big
    3. Line 12, column 9 to line 12, column 49 in card_record_set_too_big
invariant:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    | While working on the initial state:
    | conformance_state = TRUE
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in card_record_set_too_big
    1. Line 16, column 8 to line 16, column 32 in card_record_set_too_big
    2. Line 16, column 29 to line 16, column 32 in card_record_set_too_big
    3. Line 12, column 9 to line 12, column 53 in card_record_set_too_big
    4. Line 12, column 9 to line 12, column 49 in card_record_set_too_big
property:
  exit: 75
  transcript: |-
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    | While working on the initial state:
    | conformance_state = TRUE
    2178:0 Overflow when computing the number of elements in:
    [a: 1..65536, b: 1..65536]
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 14, column 9 to line 14, column 32 in card_record_set_too_big
    1. Line 15, column 12 to line 15, column 36 in card_record_set_too_big
    2. Line 15, column 33 to line 15, column 36 in card_record_set_too_big
    3. Line 12, column 9 to line 12, column 53 in card_record_set_too_big
    4. Line 12, column 9 to line 12, column 49 in card_record_set_too_big
---*)
