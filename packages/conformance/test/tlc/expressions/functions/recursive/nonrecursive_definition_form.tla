(*---
description: "f[x \\in S] == e without self-reference is an ordinary function, built at startup."
ref: "tlc2/tool/impl/Tool.java#OPCODE_nrfs"
flags: [expression]
outcome: success
---*)
---- MODULE nonrecursive_definition_form ----
EXTENDS Integers
F[x \in 1..2] == x + 1
Test == F = <<2, 3>>
====

(*--- recorded
all:
  exit: 0
---*)
