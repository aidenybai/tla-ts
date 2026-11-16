(*---
description: "UNION of enumerated sets deduplicates while it combines, so a string against an integer fails immediately."
ref: "tlc2/value/impl/UnionValue.java#union"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE combine_compares_mixed_eagerly ----
EXTENDS Integers
Test == UNION {{1}, {"a"}} # {}
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module combine_compares_mixed_eagerly failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
init:
  exit: 75
  transcript: |-
    1000:1 Attempted to check equality of integer 1 with non-integer:
    "a"
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in combine_compares_mixed_eagerly
    1. Line 11, column 29 to line 11, column 32 in combine_compares_mixed_eagerly
    2. Line 9, column 9 to line 9, column 31 in combine_compares_mixed_eagerly
    3. Line 9, column 9 to line 9, column 26 in combine_compares_mixed_eagerly
next:
  exit: 75
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.RuntimeException
    : Attempted to check equality of integer 1 with non-integer:
    "a"
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in combine_compares_mixed_eagerly
    1. Line 12, column 30 to line 12, column 33 in combine_compares_mixed_eagerly
    2. Line 9, column 9 to line 9, column 31 in combine_compares_mixed_eagerly
    3. Line 9, column 9 to line 9, column 26 in combine_compares_mixed_eagerly
invariant:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of integer 1 with non-integer:
    "a"
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in combine_compares_mixed_eagerly
    1. Line 13, column 8 to line 13, column 32 in combine_compares_mixed_eagerly
    2. Line 13, column 29 to line 13, column 32 in combine_compares_mixed_eagerly
    3. Line 9, column 9 to line 9, column 31 in combine_compares_mixed_eagerly
    4. Line 9, column 9 to line 9, column 26 in combine_compares_mixed_eagerly
property:
  exit: 75
  transcript: |-
    2102:1 Attempted to check equality of integer 1 with non-integer:
    "a"
    While working on the initial state:
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in combine_compares_mixed_eagerly
    1. Line 12, column 12 to line 12, column 36 in combine_compares_mixed_eagerly
    2. Line 12, column 33 to line 12, column 36 in combine_compares_mixed_eagerly
    3. Line 9, column 9 to line 9, column 31 in combine_compares_mixed_eagerly
    4. Line 9, column 9 to line 9, column 26 in combine_compares_mixed_eagerly
---*)
