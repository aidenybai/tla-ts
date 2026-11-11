(*---
description: "@ is the old value at the path."
ref: "tlc2/tool/impl/Tool.java#OPCODE_exc"
flags: [expression]
outcome: success
---*)
---- MODULE at_is_old_value ----
EXTENDS Integers
Test == [<<1>> EXCEPT ![1] = @ + 1] = <<2>>
====

(*--- recorded
all:
  exit: 0
---*)
