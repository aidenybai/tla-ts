(*---
description: "!<< and !>> pick the operands of an infix application."
ref: "tla2sany/semantic/Generator.java#ArgNum"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE chevrons_of_infix ----
EXTENDS Naturals
Op == 3 + 4
Test == Op!<< = 3 /\ Op!>> = 4
====

(*--- recorded
all:
  exit: 0
---*)
