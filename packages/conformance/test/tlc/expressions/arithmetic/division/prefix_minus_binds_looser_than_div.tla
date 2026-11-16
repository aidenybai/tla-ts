(*---
description: "-7 \\div 2 parses as -(7 \\div 2), so it is -3 rather than the floor -4."
ref: "tla2sany/parser/Operators.java"
flags: [expression]
outcome: success
---*)
---- MODULE prefix_minus_binds_looser_than_div ----
EXTENDS Integers
Test == -7 \div 2 = -3
====

(*--- recorded
all:
  exit: 0
---*)
