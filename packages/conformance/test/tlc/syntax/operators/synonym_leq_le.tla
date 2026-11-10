(*---
description: "A definition of \\leq is also the meaning of its synonym <=."
ref: "tla2sany/parser/Operators.java#resolveSynonym"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE synonym_leq_le ----
a \leq b == <<a, b>>
Test == (1 <= 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
