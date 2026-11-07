(*---
description: An instance may have two parameters.
ref: "tla2sany/semantic/Generator.java#processModuleDefinition"
features: [parameterized]
flags: [expression]
outcome: success
---*)
---- MODULE two_parameters ----
---- MODULE I ----
CONSTANTS a, b
d == <<a, b>>
====
M(x, y) == INSTANCE I WITH a <- x, b <- y
Test == M(1, 2)!d = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
