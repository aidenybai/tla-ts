(*---
description: A definition spelled ‥ is the meaning of ...
ref: "tla2sany/parser/Operators.java#OperatorSynonyms"
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE define_unicode_use_dotdot ----
a ‥ b == <<a, b>>
Test == (1 .. 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
