(*---
description: "\\o followed by a space is the \\o operator, so a user definition of it applies."
ref: tla2sany/parser/Operators.java
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE octal_lookalike_composition ----
EXTENDS Naturals
a \o b == a + b
Test == 1 \o 2 = 3
====

(*--- recorded
all:
  exit: 0
---*)
