(*---
description: A record element is not an edge.
ref: tlc2/module/TransitiveClosure.java#Warshall
features:
  - TransitiveClosure
flags:
  - expression
outcome: evaluation-failure
includes:
  - TransitiveClosure.tla
---*)
---- MODULE element_record ----
EXTENDS TransitiveClosure
Test == Warshall({[a |-> 1]}) = {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2157:0 Attempted to apply TransitiveClosure to a set containing
    the following value:
    [a |-> 1]
    2157:0 Attempted to apply TransitiveClosure to a set containing
    the following value:
    [a |-> 1]
init:
  exit: 75
  transcript: |-
    2157:0 Attempted to apply TransitiveClosure to a set containing
    the following value:
    [a |-> 1]
    2157:0 Attempted to apply TransitiveClosure to a set containing
    the following value:
    [a |-> 1]
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in element_record
    1. Line 16, column 29 to line 16, column 32 in element_record
    2. Line 14, column 9 to line 14, column 34 in element_record
    3. Line 14, column 9 to line 14, column 29 in element_record
next:
  exit: 255
  transcript: |-
    2157:1 Attempted to apply TransitiveClosure to a set containing
    the following value:
    [a |-> 1]
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 17, column 9 to line 17, column 33 in element_record
    1. Line 17, column 30 to line 17, column 33 in element_record
    2. Line 14, column 9 to line 14, column 34 in element_record
    3. Line 14, column 9 to line 14, column 29 in element_record
invariant:
  exit: 75
  transcript: |-
    2157:0 Attempted to apply TransitiveClosure to a set containing
    the following value:
    [a |-> 1]
    2157:0 Attempted to apply TransitiveClosure to a set containing
    the following value:
    [a |-> 1]
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in element_record
    1. Line 18, column 8 to line 18, column 32 in element_record
    2. Line 18, column 29 to line 18, column 32 in element_record
    3. Line 14, column 9 to line 14, column 34 in element_record
    4. Line 14, column 9 to line 14, column 29 in element_record
property:
  exit: 75
  transcript: |-
    2157:0 Attempted to apply TransitiveClosure to a set containing
    the following value:
    [a |-> 1]
    2157:0 Attempted to apply TransitiveClosure to a set containing
    the following value:
    [a |-> 1]
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 16, column 9 to line 16, column 32 in element_record
    1. Line 17, column 12 to line 17, column 36 in element_record
    2. Line 17, column 33 to line 17, column 36 in element_record
    3. Line 14, column 9 to line 14, column 34 in element_record
    4. Line 14, column 9 to line 14, column 29 in element_record
---*)
