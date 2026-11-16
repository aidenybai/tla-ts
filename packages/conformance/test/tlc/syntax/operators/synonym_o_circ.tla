(*---
description: "A definition of \\o is also the meaning of its synonym \\circ."
ref: "tla2sany/parser/Operators.java#resolveSynonym"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE synonym_o_circ ----
a \o b == <<a, b>>
Test == (1 \circ 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
