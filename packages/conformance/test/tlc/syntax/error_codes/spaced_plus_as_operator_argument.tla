(*---
description: "With spaces around it, + is the infix operator passed by name, not the circled plus token."
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [error_codes]
flags: [expression]
outcome: success
---*)
---- MODULE spaced_plus_as_operator_argument ----
EXTENDS Naturals
Ap(F(_, _)) == F(1, 2)
Test == Ap( + ) = 3
====

(*--- recorded
all:
  exit: 0
---*)
