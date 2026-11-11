(*---
description: DOMAIN has one operand.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE domain_operand ----
Op == DOMAIN <<1>>
Test == Op!1 = <<1>>
====

(*--- recorded
all:
  exit: 0
---*)
