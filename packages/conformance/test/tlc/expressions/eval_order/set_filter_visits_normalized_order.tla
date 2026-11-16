(*---
description: "{x \\in S : P} visits an enumerated S in normalized order."
ref: "tlc2/tool/impl/Tool.java#OPCODE_sso"
flags: [expression]
outcome: success
---*)
---- MODULE set_filter_visits_normalized_order ----
EXTENDS Integers, TLC
Test == {x \in {3, 1, 2} : PrintT(x)} = {1, 2, 3}
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
    | 3
---*)
