(*---
description: Parentheses are not a level in the selector tree.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE paren_is_not_a_level ----
Op == (((1))) = 1
Test == Op!1 = 1 /\ Op!2 = 1
====

(*--- recorded
all:
  exit: 0
---*)
