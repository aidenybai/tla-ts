(*---
description: Inclusion of a set holding a number asks a failing membership.
ref: tlc2/module/Strings.java#member
features:
  - Strings
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE subseteq_with_non_string ----
EXTENDS TLC
Test == {1} \subseteq STRING
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module subseteq_with_non_string failed.
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
init:
  exit: 75
  transcript: |-
    1000:1 
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 14, column 9 to line 14, column 32 in subseteq_with_non_string
    1. Line 14, column 29 to line 14, column 32 in subseteq_with_non_string
    2. Line 12, column 9 to line 12, column 28 in subseteq_with_non_string
    3. Line 12, column 9 to line 12, column 11 in subseteq_with_non_string


    Reason:
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
next:
  exit: 75
  transcript: |-
    2158:1 Attempted to check if the value:
    1
    is an element of STRING.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 15, column 9 to line 15, column 33 in subseteq_with_non_string
    1. Line 15, column 30 to line 15, column 33 in subseteq_with_non_string
    2. Line 12, column 9 to line 12, column 28 in subseteq_with_non_string
    3. Line 12, column 9 to line 12, column 11 in subseteq_with_non_string


    Reason:
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 14, column 9 to line 14, column 32 in subseteq_with_non_string
    1. Line 16, column 8 to line 16, column 32 in subseteq_with_non_string
    2. Line 16, column 29 to line 16, column 32 in subseteq_with_non_string
    3. Line 12, column 9 to line 12, column 28 in subseteq_with_non_string
    4. Line 12, column 9 to line 12, column 11 in subseteq_with_non_string


    Reason:
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
property:
  exit: 75
  transcript: |-
    1000:1 
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 14, column 9 to line 14, column 32 in subseteq_with_non_string
    1. Line 15, column 12 to line 15, column 36 in subseteq_with_non_string
    2. Line 15, column 33 to line 15, column 36 in subseteq_with_non_string
    3. Line 12, column 9 to line 12, column 28 in subseteq_with_non_string
    4. Line 12, column 9 to line 12, column 11 in subseteq_with_non_string


    Reason:
    2158:0 Attempted to check if the value:
    1
    is an element of STRING.
---*)
