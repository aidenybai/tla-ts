(*---
description: "\\in evaluates the element before the set."
ref: "tlc2/tool/impl/Tool.java#OPCODE_in"
flags: [expression]
outcome: success
---*)
---- MODULE in_element_then_set ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == P(1, 1) \in P(2, {1})
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
---*)
