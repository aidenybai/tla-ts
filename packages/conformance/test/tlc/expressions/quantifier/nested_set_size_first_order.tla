(*---
description: "A quantifier over a set of sets visits smaller sets first."
ref: "tlc2/tool/impl/Tool.java#contexts"
flags: [expression]
outcome: success
---*)
---- MODULE nested_set_size_first_order ----
EXTENDS Integers, TLC
Test == \A s \in {{1, 2}, {3}, {}} : PrintT(s)
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | {}
    | {3}
    | {1, 2}
---*)
