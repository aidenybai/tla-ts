(*---
description: "\\cap and \\intersect are the same built-in."
ref: "tla2sany/parser/Operators.java#OperatorSynonyms"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE builtin_synonym_cap_intersect ----
Test == ({1} \cap {2}) = ({1} \intersect {2})
====

(*--- recorded
all:
  exit: 0
---*)
