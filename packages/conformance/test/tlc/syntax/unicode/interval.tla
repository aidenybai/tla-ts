(*---
description: ‥ works as .. from Naturals.
ref: "tla2sany/parser/Operators.java#OperatorSynonyms"
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE interval ----
EXTENDS Naturals
Test == 1‥2 = {1, 2}
====

(*--- recorded
all:
  exit: 0
---*)
