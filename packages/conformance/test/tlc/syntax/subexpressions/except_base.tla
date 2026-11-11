(*---
description: "An EXCEPT's first operand is the base function."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE except_base ----
Op == [<<1>> EXCEPT ![1] = 2]
Test == Op!1 = <<1>>
====

(*--- recorded
all:
  exit: 0
---*)
