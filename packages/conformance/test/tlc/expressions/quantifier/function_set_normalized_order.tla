(*---
description: "A quantifier over a set of functions visits them in normalized order."
ref: "tlc2/tool/impl/Tool.java#contexts"
flags: [expression]
outcome: success
---*)
---- MODULE function_set_normalized_order ----
EXTENDS Integers, TLC
Test == \A f \in [{1, 2} -> {0, 1}] : PrintT(<<f[1], f[2]>>)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | <<0, 0>>
    | <<0, 1>>
    | <<1, 0>>
    | <<1, 1>>
---*)
