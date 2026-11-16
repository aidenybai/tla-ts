(*---
description: "A definition of (.) is also the meaning of its synonym \\odot."
ref: "tla2sany/parser/Operators.java#resolveSynonym"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE synonym_paren_odot ----
a (.) b == <<a, b>>
Test == (1 \odot 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
