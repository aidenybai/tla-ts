(*---
description: A LOCAL definition is usable in its own module.
ref: "tla2sany/parser/TLAplusParser.java#Body"
features: [local]
flags: [expression]
outcome: success
---*)
---- MODULE local_def_usable_here ----
LOCAL A == 1
Test == A = 1
====

(*--- recorded
all:
  exit: 0
---*)
