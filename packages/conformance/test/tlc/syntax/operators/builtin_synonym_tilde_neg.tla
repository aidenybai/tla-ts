(*---
description: "~ and \\neg are the same built-in."
ref: "tla2sany/parser/Operators.java#OperatorSynonyms"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE builtin_synonym_tilde_neg ----
Test == (~ FALSE) = (\neg FALSE)
====

(*--- recorded
all:
  exit: 0
---*)
