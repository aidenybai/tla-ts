(*---
description: "In a nested EXCEPT, @ refers to the innermost path."
ref: "tlc2/tool/impl/Tool.java#OPCODE_exc"
flags: [expression]
outcome: success
---*)
---- MODULE nested_except_inner_at ----
EXTENDS Integers
Test == [<<<<1>>>> EXCEPT ![1] = [@ EXCEPT ![1] = @ + 1]] = <<<<2>>>>
====

(*--- recorded
all:
  exit: 0
---*)
