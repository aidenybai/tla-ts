(*---
description: "A quantifier over UNION S visits the merged elements in normalized order."
ref: "tlc2/tool/impl/Tool.java#contexts"
flags: [expression]
outcome: success
---*)
---- MODULE union_normalized_order ----
EXTENDS Integers, TLC
Test == \A e \in UNION {3..4, {1}, 2..3} : PrintT(e)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
    | 3
    | 4
---*)
