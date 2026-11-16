(*---
description: "A quantifier over S \\X T visits tuples in normalized order, unlike a filter over the same set."
ref: "tlc2/tool/impl/Tool.java#contexts"
flags: [expression]
outcome: success
---*)
---- MODULE cartesian_normalized_order ----
EXTENDS Integers, TLC
Test == \A t \in {2, 1} \X {4, 3} : PrintT(t)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | <<1, 3>>
    | <<1, 4>>
    | <<2, 3>>
    | <<2, 4>>
---*)
