(*---
description: "\\times(A, B) fails the same way as \\X(A, B), since the two are synonyms."
ref: "tla2sany/semantic/Generator.java#generateOpAppl"
features: [operators, tlc-bug]
outcome: evaluation-failure
---*)
---- MODULE nonfix_times_is_tlc_null_pointer ----
ASSUME \times({1}, {2}) = {<<1, 2>>}
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 8, col 8 to line 8, col 36 of module nonfix_times_is_tlc_null_pointer failed.
    Cannot invoke "tla2sany.semantic.SemanticNode.getKind()" because "expr" is null
---*)
