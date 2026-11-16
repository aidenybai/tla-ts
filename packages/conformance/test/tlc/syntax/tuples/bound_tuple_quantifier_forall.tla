(*---
description: "\\A may bind a tuple pattern."
ref: "tla2sany/parser/TLAplusParser.java#QuantBound"
features: [tuples]
flags: [expression]
outcome: success
---*)
---- MODULE bound_tuple_quantifier_forall ----
Test == \A <<x, y>> \in {<<1, 2>>} : x = 1 /\ y = 2
====

(*--- recorded
all:
  exit: 0
---*)
