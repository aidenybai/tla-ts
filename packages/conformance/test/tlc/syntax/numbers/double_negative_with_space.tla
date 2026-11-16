(*---
description: "Prefix minus may stack, separated by a space."
ref: "tla2sany/parser/Operators.java#getMixfix"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE double_negative_with_space ----
EXTENDS Integers
Test == - - 1 = 1
====

(*--- recorded
all:
  exit: 0
---*)
