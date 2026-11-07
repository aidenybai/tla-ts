(*---
description: "# and /= are the same built-in."
ref: "tla2sany/parser/Operators.java#OperatorSynonyms"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE builtin_synonym_hash_neq ----
Test == (1 # 2) = (1 /= 2)
====

(*--- recorded
all:
  exit: 0
---*)
