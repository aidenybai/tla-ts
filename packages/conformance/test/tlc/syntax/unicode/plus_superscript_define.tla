(*---
description: A definition with ⁺ is the meaning of ^+.
ref: "tla2sany/parser/Operators.java#OperatorSynonyms"
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE plus_superscript_define ----
a ⁺ == <<a>>
Test == 1^+ = <<1>>
====

(*--- recorded
all:
  exit: 0
---*)
