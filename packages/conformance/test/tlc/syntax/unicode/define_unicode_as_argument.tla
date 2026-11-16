(*---
description: A Unicode operator may be passed as an argument.
ref: "tla2sany/parser/Operators.java#OperatorSynonyms"
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE define_unicode_as_argument ----
a ⊕ b == <<a, b>>
Op(F(_,_)) == F(1, 2)
Test == Op(⊕) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
