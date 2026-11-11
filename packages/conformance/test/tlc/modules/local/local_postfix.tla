(*---
description: A LOCAL postfix definition is accepted.
ref: "tla2sany/parser/TLAplusParser.java#Body"
features: [local]
flags: [expression]
outcome: success
---*)
---- MODULE local_postfix ----
LOCAL a ^+ == a
Test == 1^+ = 1
====

(*--- recorded
all:
  exit: 0
---*)
