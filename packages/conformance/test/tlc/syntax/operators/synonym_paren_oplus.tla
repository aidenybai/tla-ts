(*---
description: "A definition of (+) is also the meaning of its synonym \\oplus."
ref: "tla2sany/parser/Operators.java#resolveSynonym"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE synonym_paren_oplus ----
a (+) b == <<a, b>>
Test == (1 \oplus 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
