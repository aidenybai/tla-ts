(*---
description: An infix constant declared with one synonym may be targeted with another.
ref: "tla2sany/parser/Operators.java#resolveSynonym"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE infix_constant_synonym_target ----
---- MODULE I ----
CONSTANT _ (+) _
d == 1 (+) 2
====
G(a, b) == <<a, b>>
M == INSTANCE I WITH \oplus <- G
Test == M!d = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
