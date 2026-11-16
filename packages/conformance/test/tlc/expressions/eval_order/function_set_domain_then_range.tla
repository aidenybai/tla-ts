(*---
description: "[S -> T] evaluates S before T."
ref: "tlc2/tool/impl/Tool.java#OPCODE_sof"
flags: [expression]
outcome: success
---*)
---- MODULE function_set_domain_then_range ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == [P(1, {1}) -> P(2, {2})] = {<<2>>}
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
---*)
