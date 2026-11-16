(*---
description: "A definition of \\subset is the meaning of its Unicode spelling ⊂."
ref: "tla2sany/parser/Operators.java#OperatorSynonyms"
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE define_ascii_use_subset ----
a \subset b == <<a, b>>
Test == (1 ⊂ 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
