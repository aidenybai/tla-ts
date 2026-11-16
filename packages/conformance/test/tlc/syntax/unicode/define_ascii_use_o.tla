(*---
description: "A definition of \\o is the meaning of its Unicode spelling ∘."
ref: "tla2sany/parser/Operators.java#OperatorSynonyms"
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE define_ascii_use_o ----
a \o b == <<a, b>>
Test == (1 ∘ 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
