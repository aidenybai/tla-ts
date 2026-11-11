(*---
description: "{e : x \\in S, y \\in T} evaluates e with x varying fastest."
ref: "tlc2/tool/impl/Tool.java#OPCODE_soa"
flags: [expression]
outcome: success
---*)
---- MODULE set_map_first_variable_fastest ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == {P(<<x, y>>, 1) : x \in 1..2, y \in 1..2} = {1}
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | <<1, 1>>
    | <<2, 1>>
    | <<1, 2>>
    | <<2, 2>>
---*)
