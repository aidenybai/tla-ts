(*---
description: A function application has two operands.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE function_application_operands ----
Op == <<1, 2>>[1]
Test == Op!1 = <<1, 2>> /\ Op!2 = 1
====

(*--- recorded
all:
  exit: 0
---*)
