(*---
description: A LOCAL infix definition is accepted.
ref: "tla2sany/parser/TLAplusParser.java#Body"
features: [local]
flags: [expression]
outcome: success
---*)
---- MODULE local_infix ----
LOCAL a ++ b == a
Test == (1 ++ 2) = 1
====

(*--- recorded
all:
  exit: 0
---*)
