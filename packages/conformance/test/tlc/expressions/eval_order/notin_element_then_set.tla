(*---
description: "\\notin evaluates the element before the set."
ref: "tlc2/tool/impl/Tool.java#OPCODE_notin"
flags: [expression]
outcome: success
---*)
---- MODULE notin_element_then_set ----
EXTENDS Integers, TLC
P(m, v) == IF PrintT(m) THEN v ELSE v
Test == P(1, 1) \notin P(2, {2})
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | 1
    | 2
---*)
