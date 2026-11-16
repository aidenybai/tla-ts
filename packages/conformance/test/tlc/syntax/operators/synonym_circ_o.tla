(*---
description: "A definition of \\circ is also the meaning of its synonym \\o."
ref: "tla2sany/parser/Operators.java#resolveSynonym"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE synonym_circ_o ----
a \circ b == <<a, b>>
Test == (1 \o 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
