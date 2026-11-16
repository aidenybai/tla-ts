(*---
description: A LOCAL definition may have parameters.
ref: "tla2sany/parser/TLAplusParser.java#Body"
features: [local]
flags: [expression]
outcome: success
---*)
---- MODULE local_with_parameter ----
LOCAL A(x) == x
Test == A(1) = 1
====

(*--- recorded
all:
  exit: 0
---*)
