(*---
description: "\\X and \\times are the same built-in."
ref: "tla2sany/parser/Operators.java#OperatorSynonyms"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE builtin_synonym_x_times ----
Test == ({1} \X {2}) = ({1} \times {2})
====

(*--- recorded
all:
  exit: 0
---*)
