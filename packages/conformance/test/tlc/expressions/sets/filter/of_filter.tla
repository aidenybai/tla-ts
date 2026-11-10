(*---
description: "A filter can range over another filter."
ref: "tlc2/tool/impl/Tool.java#OPCODE_sso"
flags: [expression]
outcome: success
---*)
---- MODULE of_filter ----
EXTENDS Integers
Test == {x \in {y \in 1..5 : y > 1} : x < 4} = {2, 3}
====

(*--- recorded
all:
  exit: 0
---*)
