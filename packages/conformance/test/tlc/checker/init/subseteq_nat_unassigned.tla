(*---
description: x \subseteq Nat on an unassigned x must enumerate SUBSET Nat, which fails.
ref: tlc2/tool/impl/Tool.java#getInitStatesAppl OPCODE_subseteq
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE subseteq_nat_unassigned ----
EXTENDS Naturals, TLC
VARIABLE x
Next == UNCHANGED x
Init == x \subseteq Nat
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    1000:1 Attempted to compute the number of elements in the overridden value Nat.
    2147:1 TLC was unable to fingerprint.

    Fingerprint Stack Trace:
    0. Line 13, column 9 to line 13, column 23 in subseteq_nat_unassigned
    1. Line 13, column 21 to line 13, column 23 in subseteq_nat_unassigned


    Reason:
    Attempted to compute the number of elements in the overridden value Nat.
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
