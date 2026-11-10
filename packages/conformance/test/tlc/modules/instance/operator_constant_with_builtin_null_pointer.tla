(*---
description: "SANY accepts a built-in as the value of an operator constant in WITH, but TLC follows the built-in's missing body and fails with a null pointer error, though the same built-in works as an operator argument."
ref: "tlc2/tool/impl/Tool.java#evalImpl"
features: [instance, tlc-bug]
outcome: tlc-error
correct:
  all:
    exit: 0
    transcript: |-
      2190:0 Finished computing initial states: 0 distinct states generated at <date>.
      2193:0 Model checking completed. No error has been found.
        Estimates of the probability that TLC did not check all reachable states
        because two distinct states had the same fingerprint:
        calculated (optimistic):  val = 0.0
      2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
      2194:0 The depth of the complete state graph search is 0.
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
