(*---
description: "\\/ and \\lor are the same built-in."
ref: "tla2sany/parser/Operators.java#OperatorSynonyms"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE builtin_synonym_or_lor ----
Test == (TRUE \/ FALSE) = (TRUE \lor FALSE)
====

(*--- recorded
all:
  exit: 0
---*)
