(*---
description: "\\X(A, B) parses as an ordinary application of the \\X built-in, which has no body for TLC to evaluate, so TLC fails with a null pointer message instead of building the product or rejecting the syntax."
ref: "tla2sany/semantic/Generator.java#generateOpAppl"
features: [operators, tlc-bug]
outcome: evaluation-failure
---*)
---- MODULE nonfix_cross_is_tlc_null_pointer ----
ASSUME \X({1}, {2}) = {<<1, 2>>}
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 8, col 8 to line 8, col 32 of module nonfix_cross_is_tlc_null_pointer failed.
    Cannot invoke "tla2sany.semantic.SemanticNode.getKind()" because "expr" is null
---*)
