(*---
description: A Unicode operator may be applied in nonfix form.
ref: "tla2sany/parser/Operators.java#OperatorSynonyms"
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE define_unicode_nonfix ----
a ⊕ b == <<a, b>>
Test == ⊕(1, 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
