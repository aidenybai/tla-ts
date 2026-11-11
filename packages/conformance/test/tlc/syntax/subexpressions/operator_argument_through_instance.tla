(*---
description: "An instance's operator may be passed as an argument."
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE operator_argument_through_instance ----
M == INSTANCE Naturals
Ap(F(_,_)) == F(1, 2)
Test == Ap(M!+) = 3
====

(*--- recorded
all:
  exit: 0
---*)
