(*---
description: "<=> and \\equiv are the same built-in."
ref: "tla2sany/parser/Operators.java#OperatorSynonyms"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE builtin_synonym_iff_equiv ----
Test == (TRUE <=> FALSE) = (TRUE \equiv FALSE)
====

(*--- recorded
all:
  exit: 0
---*)
