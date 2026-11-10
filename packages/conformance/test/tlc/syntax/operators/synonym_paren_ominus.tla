(*---
description: "A definition of (-) is also the meaning of its synonym \\ominus."
ref: "tla2sany/parser/Operators.java#resolveSynonym"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE synonym_paren_ominus ----
a (-) b == <<a, b>>
Test == (1 \ominus 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
