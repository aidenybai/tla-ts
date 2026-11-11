(*---
description: ← works as <- in a substitution.
ref: "tla2sany/parser/TLAplusParser.java#Substitution"
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE instance_with_arrow ----
---- MODULE Inner ----
CONSTANT c
d == c
====
M ≜ INSTANCE Inner WITH c ← 1
Test == M!d = 1
====

(*--- recorded
all:
  exit: 0
---*)
