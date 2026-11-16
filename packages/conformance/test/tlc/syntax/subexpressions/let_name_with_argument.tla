(*---
description: A LET operator takes its argument after its name.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE let_name_with_argument ----
Op == LET a(x) == x IN a(3) = 3
Test == Op!:!a(4) = 4
====

(*--- recorded
all:
  exit: 0
---*)
