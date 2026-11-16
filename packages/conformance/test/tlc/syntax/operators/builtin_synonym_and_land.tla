(*---
description: "/\\ and \\land are the same built-in."
ref: "tla2sany/parser/Operators.java#OperatorSynonyms"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE builtin_synonym_and_land ----
Test == (TRUE /\ FALSE) = (TRUE \land FALSE)
====

(*--- recorded
all:
  exit: 0
---*)
