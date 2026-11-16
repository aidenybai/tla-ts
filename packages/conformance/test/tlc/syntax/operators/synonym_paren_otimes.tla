(*---
description: "A definition of (\\X) is also the meaning of its synonym \\otimes."
ref: "tla2sany/parser/Operators.java#resolveSynonym"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE synonym_paren_otimes ----
a (\X) b == <<a, b>>
Test == (1 \otimes 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
