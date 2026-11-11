(*---
description: "A function definition's bound names are label parameters."
ref: "tla2sany/semantic/Generator.java#processFunction"
features: [labels]
flags: [expression]
outcome: success
---*)
---- MODULE label_in_function_definition ----
f[x \in {1}] == l(x):: x = 1
Test == f[1]
====

(*--- recorded
all:
  exit: 0
---*)
