(*---
description: "An initial state holding an infinite set fails with the message that a variable's value contains Nat."
ref: tlc2/tool/TLCStateMut.java#fingerPrint
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE state_with_infinite_value_fails_fingerprint ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = Nat
Next == x' = x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 TLC has found a state in which the value of a variable contains Nat
    While working on the initial state:
    x = Nat
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 15 in state_with_infinite_value_fails_fingerprint
    2199:0 1 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
