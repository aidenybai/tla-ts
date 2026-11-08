(*---
description: "EXCEPT computes @ by selecting the old value, so an erroring body runs even if @ is unused."
ref: "tlc2/tool/impl/Tool.java#OPCODE_exc"
flags: [expression]
outcome: evaluation-failure
---*)
---- MODULE lazy_function_at_runs_body ----
EXTENDS Integers
Test == [[x \in Nat |-> 1 \div 0] EXCEPT ![1] = 0][1] = 0
====

(*--- recorded
assume:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 10, col 8 to line 10, col 11 of module lazy_function_at_runs_body failed.
    2179:0 The second argument of \div is 0.
init:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_function_at_runs_body
    1. Line 11, column 29 to line 11, column 32 in lazy_function_at_runs_body
    2. Line 9, column 9 to line 9, column 57 in lazy_function_at_runs_body
    3. Line 9, column 9 to line 9, column 53 in lazy_function_at_runs_body
    4. Line 9, column 9 to line 9, column 50 in lazy_function_at_runs_body
    5. Line 9, column 25 to line 9, column 32 in lazy_function_at_runs_body
next:
  exit: 255
  transcript: |-
    2179:1 The second argument of \div is 0.
    2121:1 The behavior up to this point is:
    2217:4 1: <Initial predicate>
    conformance_state = TRUE
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 33 in lazy_function_at_runs_body
    1. Line 12, column 30 to line 12, column 33 in lazy_function_at_runs_body
    2. Line 9, column 9 to line 9, column 57 in lazy_function_at_runs_body
    3. Line 9, column 9 to line 9, column 53 in lazy_function_at_runs_body
    4. Line 9, column 9 to line 9, column 50 in lazy_function_at_runs_body
    5. Line 9, column 25 to line 9, column 32 in lazy_function_at_runs_body
invariant:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_function_at_runs_body
    1. Line 13, column 8 to line 13, column 32 in lazy_function_at_runs_body
    2. Line 13, column 29 to line 13, column 32 in lazy_function_at_runs_body
    3. Line 9, column 9 to line 9, column 57 in lazy_function_at_runs_body
    4. Line 9, column 9 to line 9, column 53 in lazy_function_at_runs_body
    5. Line 9, column 9 to line 9, column 50 in lazy_function_at_runs_body
    6. Line 9, column 25 to line 9, column 32 in lazy_function_at_runs_body
property:
  exit: 75
  transcript: |-
    1000:1 
    2179:0 The second argument of \div is 0.
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 11, column 9 to line 11, column 32 in lazy_function_at_runs_body
    1. Line 12, column 12 to line 12, column 36 in lazy_function_at_runs_body
    2. Line 12, column 33 to line 12, column 36 in lazy_function_at_runs_body
    3. Line 9, column 9 to line 9, column 57 in lazy_function_at_runs_body
    4. Line 9, column 9 to line 9, column 53 in lazy_function_at_runs_body
    5. Line 9, column 9 to line 9, column 50 in lazy_function_at_runs_body
    6. Line 9, column 25 to line 9, column 32 in lazy_function_at_runs_body
---*)
