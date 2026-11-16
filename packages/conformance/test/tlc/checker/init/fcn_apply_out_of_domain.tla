(*---
description: f[e] with an index out of a tuple's bounds fails the replay as a fingerprint exception, because the exception isn't an EvalException.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl OPCODE_fa
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE fcn_apply_out_of_domain ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == <<TRUE>>[2] /\ x = 1
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 Attempted to access index 2 of tuple
    <<TRUE>>
    which is out of bounds.
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 13, column 9 to line 13, column 28 in fcn_apply_out_of_domain
    1. Line 13, column 9 to line 13, column 19 in fcn_apply_out_of_domain
    2. Line 13, column 9 to line 13, column 16 in fcn_apply_out_of_domain


    Reason:
    Attempted to access index 2 of tuple
    <<TRUE>>
    which is out of bounds.
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
