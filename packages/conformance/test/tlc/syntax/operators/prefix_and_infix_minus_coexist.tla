(*---
description: "Prefix and infix minus are different symbols, so both may be defined."
ref: "tla2sany/parser/TLAplusParser.java#PrefixLHS"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE prefix_and_infix_minus_coexist ----
-. a == <<a>>
a - b == <<a, b>>
Test == -1 = <<1>> /\ (1 - 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
