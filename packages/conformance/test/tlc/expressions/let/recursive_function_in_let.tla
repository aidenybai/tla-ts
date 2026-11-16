(*---
description: "A function definition in a LET can refer to itself."
ref: "tlc2/tool/impl/Tool.java#OPCODE_rfs"
flags: [expression]
outcome: success
---*)
---- MODULE recursive_function_in_let ----
EXTENDS Integers
Test == LET f[n \in 0..3] == IF n = 0 THEN 0 ELSE n + f[n - 1] IN f[3] = 6
====

(*--- recorded
all:
  exit: 0
---*)
