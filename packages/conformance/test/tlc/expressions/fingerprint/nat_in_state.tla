(*---
description: "Nat cannot be fingerprinted, so it cannot be the value of a variable."
ref: "tlc2/value/impl/Value.java#fingerPrint"
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE nat_in_state ----
EXTENDS Integers
VARIABLE x
Init == x = Nat
Next == UNCHANGED x
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
    0. Line 12, column 9 to line 12, column 15 in nat_in_state
    2199:0 1 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
