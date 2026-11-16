(*---
description: "\\neg and \\lnot are the same built-in."
ref: "tla2sany/parser/Operators.java#OperatorSynonyms"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE builtin_synonym_neg_lnot ----
Test == (\neg FALSE) = (\lnot FALSE)
====

(*--- recorded
all:
  exit: 0
---*)
