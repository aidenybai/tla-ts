(*---
description: "!: after a name selects the body, the same as the name alone."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE colon_selects_body ----
Op == LET a == 3 IN a = 3
Test == Op!:
====

(*--- recorded
all:
  exit: 0
---*)
