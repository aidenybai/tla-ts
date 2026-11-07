(*---
description: "\\cup and \\union are the same built-in."
ref: "tla2sany/parser/Operators.java#OperatorSynonyms"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE builtin_synonym_cup_union ----
Test == ({1} \cup {2}) = ({1} \union {2})
====

(*--- recorded
all:
  exit: 0
---*)
