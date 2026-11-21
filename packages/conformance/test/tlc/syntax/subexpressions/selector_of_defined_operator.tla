(*---
description: A selector after a defined operator symbol picks part of its definition.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE selector_of_defined_operator ----
EXTENDS Naturals
a ^# == a = 1
a (+) b == <<a, b + 1>>
Test == ^#(2)!1 = 2 /\ (+)(1, 2)!>> = 3 /\ \oplus(4, 5)!<< = 4
====

(*--- recorded
all:
  exit: 0
---*)
