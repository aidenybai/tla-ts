(*---
description: "A quantifier over a lazy \\cup visits the merged elements in normalized order."
ref: "tlc2/tool/impl/Tool.java#contexts"
flags: [expression]
outcome: success
---*)
---- MODULE set_cup_normalized_order ----
EXTENDS Integers, TLC
Test == \A e \in (1..2) \cup {0} : PrintT(e)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 0
    | 1
    | 2
---*)
