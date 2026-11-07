(*---
description: "EXCEPT handles its clauses in source order."
ref: "tlc2/tool/impl/Tool.java#OPCODE_exc"
flags: [expression]
outcome: success
---*)
---- MODULE except_clauses_in_order ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == [<<0, 0>> EXCEPT ![P(2, 2)] = P(1, 5), ![P(4, 1)] = P(3, 6)] = <<6, 5>>
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 2
    | 1
    | 4
    | 3
---*)
