(*---
description: "A quantifier over SUBSET S visits smaller subsets first, then in element order."
ref: "tlc2/value/impl/SubsetValue.java#elements"
flags: [expression]
outcome: success
---*)
---- MODULE subset_normalized_order ----
EXTENDS Integers, TLC
Test == \A s \in SUBSET {3, 1, 2} : PrintT(s)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | {}
    | {1}
    | {2}
    | {3}
    | {1, 2}
    | {1, 3}
    | {2, 3}
    | {1, 2, 3}
---*)
