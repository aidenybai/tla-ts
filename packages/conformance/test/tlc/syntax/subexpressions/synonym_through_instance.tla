(*---
description: "An operator's synonym resolves through an instance prefix in nonfix form."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE synonym_through_instance ----
---- MODULE I ----
a \oplus b == a
====
M == INSTANCE I
Test == M!(+)(1, 2) = 1
====

(*--- recorded
all:
  exit: 0
---*)
