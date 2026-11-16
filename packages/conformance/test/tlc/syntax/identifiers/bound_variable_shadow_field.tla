(*---
description: A bound variable and a field share a spelling without conflict.
ref: "tla2sany/semantic/Generator.java#processBoundQuant"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE bound_variable_shadow_field ----
Test == \A a \in {1} : [a |-> 2].a = 2
====

(*--- recorded
all:
  exit: 0
---*)
