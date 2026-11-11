(*---
description: "!<< picks the first of any number of operands."
ref: "tla2sany/semantic/Generator.java#ArgNum"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE chevron_left_on_three_operands ----
Op == <<1, 2, 3>>
Test == Op!<< = 1
====

(*--- recorded
all:
  exit: 0
---*)
