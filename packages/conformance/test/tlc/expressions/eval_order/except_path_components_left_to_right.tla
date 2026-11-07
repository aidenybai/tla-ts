(*---
description: "EXCEPT evaluates a nested path left to right."
ref: "tlc2/tool/impl/Tool.java#OPCODE_exc"
flags: [expression]
outcome: success
---*)
---- MODULE except_path_components_left_to_right ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == [<<<<0>>>> EXCEPT ![P(1, 1)][P(2, 1)] = 7] = <<<<7>>>>
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
---*)
