(*---
description: "@ in a nested path is the value at the end of the path."
ref: "tlc2/tool/impl/Tool.java#OPCODE_exc"
flags: [expression]
outcome: success
---*)
---- MODULE at_is_nested_value ----
EXTENDS Integers
Test == [<<<<5>>>> EXCEPT ![1][1] = @ + 1] = <<<<6>>>>
====

(*--- recorded
all:
  exit: 0
---*)
