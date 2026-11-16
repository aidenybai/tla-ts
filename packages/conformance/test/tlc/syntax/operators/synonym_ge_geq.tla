(*---
description: "A definition of >= is also the meaning of its synonym \\geq."
ref: "tla2sany/parser/Operators.java#resolveSynonym"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE synonym_ge_geq ----
a >= b == <<a, b>>
Test == (1 \geq 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
