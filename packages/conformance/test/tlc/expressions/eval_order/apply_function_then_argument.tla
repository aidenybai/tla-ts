(*---
description: "f[e] evaluates f before e."
ref: "tlc2/tool/impl/Tool.java#OPCODE_fa"
flags: [expression]
outcome: success
---*)
---- MODULE apply_function_then_argument ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == P(1, <<7>>)[P(2, 1)] = 7
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
---*)
