(*---
description: A LOCAL function definition is accepted.
ref: "tla2sany/parser/TLAplusParser.java#Body"
features: [local]
flags: [expression]
outcome: success
---*)
---- MODULE local_function ----
LOCAL f[x \in {1}] == x
Test == f[1] = 1
====

(*--- recorded
all:
  exit: 0
---*)
