(*---
description: "An ordinary definition that uses a theorem name keeps the instance's substitution, unlike the theorem name itself."
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [instance]
flags: [expression]
outcome: success
---*)
---- MODULE theorem_through_definition_keeps_substitution ----
---- MODULE I ----
CONSTANT c
THEOREM T == c = 1
U == T
====
M == INSTANCE I WITH c <- 1
N == INSTANCE I WITH c <- 2
Test == M!U /\ ~N!U
====

(*--- recorded
all:
  exit: 0
---*)
