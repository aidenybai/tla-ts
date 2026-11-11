(*---
description: "Parentheses make \\X nest, so it is not associative."
ref: "tlc2/tool/impl/Tool.java#OPCODE_cp"
flags: [expression]
outcome: success
---*)
---- MODULE parenthesized_is_nested ----
EXTENDS Integers
Test == ({1} \X {2}) \X {3} = {<<<<1, 2>>, 3>>}
====

(*--- recorded
all:
  exit: 0
---*)
