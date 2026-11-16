(*---
description: "EXCEPT evaluates the base, then the path, then the new value."
ref: "tlc2/tool/impl/Tool.java#OPCODE_exc"
flags: [expression]
outcome: success
---*)
---- MODULE except_base_path_value ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == [P(1, <<0>>) EXCEPT ![P(2, 1)] = P(3, 9)] = <<9>>
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
    | 3
---*)
