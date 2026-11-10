(*---
description: "/\\ passed by name keeps its short circuit, because arguments stay lazy until the opcode reads them."
ref: "tlc2/tool/impl/Tool.java#evalApplImpl"
flags: [expression]
outcome: success
---*)
---- MODULE builtin_and_by_name_short_circuits ----
EXTENDS Integers
Apply2(f(_, _), a, b) == f(a, b)
Test == Apply2(/\, FALSE, 1 \div 0 = 0) = FALSE
====

(*--- recorded
all:
  exit: 0
---*)
