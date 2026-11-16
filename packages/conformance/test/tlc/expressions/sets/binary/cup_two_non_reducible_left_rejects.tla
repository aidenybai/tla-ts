(*---
description: "\\cup of two non-Reducible sets asks the left one first, and Nat rejects a string that STRING holds."
ref: "tlc2/value/impl/SetCupValue.java#member"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE cup_two_non_reducible_left_rejects ----
EXTENDS Integers
Test == "a" \in (Nat \cup STRING)
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module cup_two_non_reducible_left_rejects failed.
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
init:
  exit: 75
  transcript: |-
    1000:1 
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in cup_two_non_reducible_left_rejects
    1. Line 11, column 29 to line 11, column 32 in cup_two_non_reducible_left_rejects
    2. Line 9, column 9 to line 9, column 33 in cup_two_non_reducible_left_rejects
    3. Line 9, column 18 to line 9, column 32 in cup_two_non_reducible_left_rejects


    Reason:
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
next:
  exit: 75
  transcript: |-
    2158:1 Attempted to check if the value:
    "a"
    is an element of Nat.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 12, column 9 to line 12, column 33 in cup_two_non_reducible_left_rejects
    1. Line 12, column 30 to line 12, column 33 in cup_two_non_reducible_left_rejects
    2. Line 9, column 9 to line 9, column 33 in cup_two_non_reducible_left_rejects
    3. Line 9, column 18 to line 9, column 32 in cup_two_non_reducible_left_rejects


    Reason:
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in cup_two_non_reducible_left_rejects
    1. Line 13, column 8 to line 13, column 32 in cup_two_non_reducible_left_rejects
    2. Line 13, column 29 to line 13, column 32 in cup_two_non_reducible_left_rejects
    3. Line 9, column 9 to line 9, column 33 in cup_two_non_reducible_left_rejects
    4. Line 9, column 18 to line 9, column 32 in cup_two_non_reducible_left_rejects


    Reason:
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
property:
  exit: 75
  transcript: |-
    1000:1 
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 11, column 9 to line 11, column 32 in cup_two_non_reducible_left_rejects
    1. Line 12, column 12 to line 12, column 36 in cup_two_non_reducible_left_rejects
    2. Line 12, column 33 to line 12, column 36 in cup_two_non_reducible_left_rejects
    3. Line 9, column 9 to line 9, column 33 in cup_two_non_reducible_left_rejects
    4. Line 9, column 18 to line 9, column 32 in cup_two_non_reducible_left_rejects


    Reason:
    2158:0 Attempted to check if the value:
    "a"
    is an element of Nat.
---*)
