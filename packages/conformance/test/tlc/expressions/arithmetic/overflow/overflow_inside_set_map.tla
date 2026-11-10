(*---
description: "Overflow in a set map surfaces as soon as the binding runs."
ref: "tlc2/module/Naturals.java#Plus"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE overflow_inside_set_map ----
EXTENDS Integers
Test == {x + 2147483647 : x \in 0..1} # {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module overflow_inside_set_map failed.
    2178:0 Overflow when computing 1+2147483647
init:
  exit: 75
  transcript: |-
    1000:1 
    2178:0 Overflow when computing 1+2147483647
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in overflow_inside_set_map
    1. Line 11, column 29 to line 11, column 32 in overflow_inside_set_map
    2. Line 9, column 9 to line 9, column 42 in overflow_inside_set_map
    3. Line 9, column 9 to line 9, column 37 in overflow_inside_set_map
    4. Line 9, column 10 to line 9, column 23 in overflow_inside_set_map
next:
  exit: 255
  transcript: |-
    2178:1 Overflow when computing 1+2147483647
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in overflow_inside_set_map
    1. Line 12, column 30 to line 12, column 33 in overflow_inside_set_map
    2. Line 9, column 9 to line 9, column 42 in overflow_inside_set_map
    3. Line 9, column 9 to line 9, column 37 in overflow_inside_set_map
    4. Line 9, column 10 to line 9, column 23 in overflow_inside_set_map
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2178:0 Overflow when computing 1+2147483647
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in overflow_inside_set_map
    1. Line 13, column 8 to line 13, column 32 in overflow_inside_set_map
    2. Line 13, column 29 to line 13, column 32 in overflow_inside_set_map
    3. Line 9, column 9 to line 9, column 42 in overflow_inside_set_map
    4. Line 9, column 9 to line 9, column 37 in overflow_inside_set_map
    5. Line 9, column 10 to line 9, column 23 in overflow_inside_set_map
property:
  exit: 75
  transcript: |-
    1000:1 
    2178:0 Overflow when computing 1+2147483647
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in overflow_inside_set_map
    1. Line 12, column 12 to line 12, column 36 in overflow_inside_set_map
    2. Line 12, column 33 to line 12, column 36 in overflow_inside_set_map
    3. Line 9, column 9 to line 9, column 42 in overflow_inside_set_map
    4. Line 9, column 9 to line 9, column 37 in overflow_inside_set_map
    5. Line 9, column 10 to line 9, column 23 in overflow_inside_set_map
---*)
