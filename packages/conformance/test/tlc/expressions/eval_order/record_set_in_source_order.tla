(*---
description: "A set of records evaluates its field sets in source order."
ref: "tlc2/tool/impl/Tool.java#OPCODE_sor"
flags: [expression]
outcome: success
---*)
---- MODULE record_set_in_source_order ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == [zb : P(1, {1}), za : P(2, {2})] = {[za |-> 2, zb |-> 1]}
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
---*)
