(*---
description: "A definition of \\otimes is also the meaning of its synonym (\\X)."
ref: "tla2sany/parser/Operators.java#resolveSynonym"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE synonym_otimes_paren ----
a \otimes b == <<a, b>>
Test == (1 (\X) 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
