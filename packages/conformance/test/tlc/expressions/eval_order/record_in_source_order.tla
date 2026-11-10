(*---
description: "A record constructor evaluates its fields in source order, before it sorts the names."
ref: "tlc2/tool/impl/Tool.java#OPCODE_rc"
flags: [expression]
outcome: success
---*)
---- MODULE record_in_source_order ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == [zb |-> P(1, 1), za |-> P(2, 2)].za = 2
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
---*)
