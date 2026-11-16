(*---
description: "∘ works as \\o from Sequences."
ref: "tla2sany/parser/Operators.java#OperatorSynonyms"
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE concat_std ----
EXTENDS Sequences
Test == <<1>> ∘ <<2>> = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
