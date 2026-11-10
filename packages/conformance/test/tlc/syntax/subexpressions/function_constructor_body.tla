(*---
description: "A function constructor's domain is !1 and its body is !(e)."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE function_constructor_body ----
Op == [x \in {1} |-> x]
Test == Op!1 = {1} /\ Op!(7) = 7
====

(*--- recorded
all:
  exit: 0
---*)
