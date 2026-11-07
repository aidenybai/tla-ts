(*---
description: "A definition spelled ⊕ is the meaning of \\oplus."
ref: "tla2sany/parser/Operators.java#OperatorSynonyms"
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE define_unicode_use_oplus ----
a ⊕ b == <<a, b>>
Test == (1 \oplus 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
