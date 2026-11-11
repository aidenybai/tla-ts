(*---
description: "The LET grammar shares OperatorOrFunctionDefinition with the module level, so LOCAL is accepted in a LET."
ref: "tla2sany/parser/TLAplusParser.java#Body"
features: [local]
flags: [expression]
outcome: success
---*)
---- MODULE local_in_let ----
Test == (LET LOCAL a == 1 IN a) = 1
====

(*--- recorded
all:
  exit: 0
---*)
