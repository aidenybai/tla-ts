(*---
description: "f[a, b] evaluates f, then a, then b, because the arguments form a tuple."
ref: "tlc2/tool/impl/Tool.java#OPCODE_fa"
flags: [expression]
outcome: success
---*)
---- MODULE multi_argument_apply_arguments_in_order ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == P(1, [x, y \in {1} |-> x])[P(2, 1), P(3, 1)] = 1
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
    | 3
---*)
