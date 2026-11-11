(*---
description: "!1 and !2 pick the operands of an infix application."
ref: "tla2sany/semantic/Generator.java#ArgNum"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE operand_of_infix ----
EXTENDS Naturals
Op == 3 + 4
Test == Op!1 = 3 /\ Op!2 = 4
====

(*--- recorded
all:
  exit: 0
---*)
