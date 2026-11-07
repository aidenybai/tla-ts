(*---
description: "A filter over Nat must be enumerated for its fingerprint, which fails."
ref: "tlc2/value/impl/SetPredValue.java#fingerPrint"
outcome: evaluation-failure
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE nat_filter_in_state ----
EXTENDS Integers
VARIABLE x
Init == x = {n \in Nat : n < 2}
Next == UNCHANGED x
====

(*--- recorded
all:
  exit: 75
  transcript: |-
    2102:1 Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
    While working on the initial state:
    x = {n \in Nat : <expression line 12, col 26 to line 12, col 30 of module nat_filter_in_state> }
    2103:1 The error occurred when TLC was evaluating the nested
    expressions at the following positions:
    0. Line 12, column 9 to line 12, column 31 in nat_filter_in_state
    2199:0 1 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 1.
---*)
