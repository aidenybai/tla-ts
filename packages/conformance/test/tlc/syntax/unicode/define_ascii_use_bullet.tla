(*---
description: "A definition of \\bullet is the meaning of its Unicode spelling ●."
ref: "tla2sany/parser/Operators.java#OperatorSynonyms"
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE define_ascii_use_bullet ----
a \bullet b == <<a, b>>
Test == (1 ● 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
