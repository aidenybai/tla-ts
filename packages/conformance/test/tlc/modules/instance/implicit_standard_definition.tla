(*---
description: A definition from an extended standard module substitutes implicitly.
ref: "tla2sany/semantic/SubstInNode.java#constructSubst"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE implicit_standard_definition ----
---- MODULE I ----
CONSTANT Nat
d == 1 \in Nat
====
Nat == {1}
M == INSTANCE I
Test == M!d
====

(*--- recorded
all:
  exit: 0
---*)
