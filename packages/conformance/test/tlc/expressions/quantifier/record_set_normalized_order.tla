(*---
description: "A quantifier over a set of records visits them in normalized order."
ref: "tlc2/tool/impl/Tool.java#contexts"
flags: [expression]
outcome: success
---*)
---- MODULE record_set_normalized_order ----
EXTENDS Integers, TLC
Test == \A r \in [zp : {2, 1}, zq : {4, 3}] : PrintT(<<r.zp, r.zq>>)
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
