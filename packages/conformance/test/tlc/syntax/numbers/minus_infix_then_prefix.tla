(*---
description: a - -b parses as infix then prefix.
ref: "tla2sany/parser/Operators.java#getMixfix"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE minus_infix_then_prefix ----
EXTENDS Integers
Test == 3 - -1 = 4
====

(*--- recorded
all:
  exit: 0
---*)
