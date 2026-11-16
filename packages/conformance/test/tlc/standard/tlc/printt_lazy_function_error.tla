(*---
description: PrintT of a lazy function evaluates its body, and an error there propagates.
ref: tlc2/module/TLC.java#PrintT
features:
  - TLC
flags:
  - expression
outcome: evaluation-failure
---*)
---- MODULE printt_lazy_function_error ----
EXTENDS TLC, Naturals
Test == PrintT([x \in {1} |-> x \div 0])
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 13, col 8 to line 13, col 11 of module printt_lazy_function_error failed.
    2179:0 The second argument of \div is 0.
init:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 14, column 9 to line 14, column 32 in printt_lazy_function_error
    1. Line 14, column 29 to line 14, column 32 in printt_lazy_function_error
    2. Line 12, column 9 to line 12, column 40 in printt_lazy_function_error
    3. Line 12, column 16 to line 12, column 39 in printt_lazy_function_error
    4. Line 12, column 31 to line 12, column 38 in printt_lazy_function_error


    Reason:
    2179:0 The second argument of \div is 0.
next:
  exit: 75
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 15, column 9 to line 15, column 33 in printt_lazy_function_error
    1. Line 15, column 30 to line 15, column 33 in printt_lazy_function_error
    2. Line 12, column 9 to line 12, column 40 in printt_lazy_function_error
    3. Line 12, column 16 to line 12, column 39 in printt_lazy_function_error
    4. Line 12, column 31 to line 12, column 38 in printt_lazy_function_error


    Reason:
    2179:0 The second argument of \div is 0.
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 14, column 9 to line 14, column 32 in printt_lazy_function_error
    1. Line 16, column 8 to line 16, column 32 in printt_lazy_function_error
    2. Line 16, column 29 to line 16, column 32 in printt_lazy_function_error
    3. Line 12, column 9 to line 12, column 40 in printt_lazy_function_error
    4. Line 12, column 16 to line 12, column 39 in printt_lazy_function_error
    5. Line 12, column 31 to line 12, column 38 in printt_lazy_function_error


    Reason:
    2179:0 The second argument of \div is 0.
property:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 14, column 9 to line 14, column 32 in printt_lazy_function_error
    1. Line 15, column 12 to line 15, column 36 in printt_lazy_function_error
    2. Line 15, column 33 to line 15, column 36 in printt_lazy_function_error
    3. Line 12, column 9 to line 12, column 40 in printt_lazy_function_error
    4. Line 12, column 16 to line 12, column 39 in printt_lazy_function_error
    5. Line 12, column 31 to line 12, column 38 in printt_lazy_function_error


    Reason:
    2179:0 The second argument of \div is 0.
---*)
