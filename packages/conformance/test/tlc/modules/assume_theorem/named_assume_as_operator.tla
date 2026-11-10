(*---
description: A named assumption is an expression.
ref: "tla2sany/semantic/Generator.java#processAssumption"
features: [assume_theorem]
flags: [expression]
outcome: success
---*)
---- MODULE named_assume_as_operator ----
ASSUME A == 1 = 1
Test == A
====

(*--- recorded
all:
  exit: 0
---*)
