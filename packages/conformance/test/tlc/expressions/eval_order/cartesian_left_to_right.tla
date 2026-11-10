(*---
description: "S \\X T \\X U evaluates its operands left to right."
ref: "tlc2/tool/impl/Tool.java#OPCODE_cp"
flags: [expression]
outcome: success
---*)
---- MODULE cartesian_left_to_right ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == P(1, {1}) \X P(2, {2}) \X P(3, {3}) = {<<1, 2, 3>>}
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
    | 3
---*)
