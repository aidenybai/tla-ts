(*---
description: ⁺ works as the postfix ^+.
ref: "tla2sany/parser/Operators.java#OperatorSynonyms"
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE plus_superscript_postfix ----
a ^+ == <<a>>
Test == 1⁺ = <<1>>
====

(*--- recorded
all:
  exit: 0
---*)
