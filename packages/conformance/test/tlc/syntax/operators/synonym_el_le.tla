(*---
description: A definition of =< is also the meaning of its synonym <=.
ref: "tla2sany/parser/Operators.java#resolveSynonym"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE synonym_el_le ----
a =< b == <<a, b>>
Test == (1 <= 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
