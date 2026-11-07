(*---
description: "SANY accepts a built-in as the value of an operator constant in WITH, but TLC follows the built-in's missing body and fails with a null pointer error, though the same built-in works as an operator argument."
ref: "tlc2/tool/impl/Tool.java#evalImpl"
features: [instance, tlc-bug]
outcome: tlc-error
---*)
---- MODULE operator_constant_with_builtin_null_pointer ----
---- MODULE I ----
CONSTANT F(_, _)
d == F({1}, {2})
====
M == INSTANCE I WITH F <- \cup
ASSUME M!d = {1, 2}
====

(*--- recorded
all:
  exit: 255
  transcript: |-
    1000:1 TLC threw an unexpected exception.
    This was probably caused by an error in the spec or model.
    See the User Output or TLC Console for clues to what happened.
    The exception was a java.lang.NullPointerException
    : Cannot invoke "tla2sany.semantic.SemanticNode.getKind()" because "expr" is null
---*)
