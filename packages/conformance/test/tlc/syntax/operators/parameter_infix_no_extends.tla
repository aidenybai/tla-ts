(*---
description: An infix parameter named + works when nothing else defines +.
ref: "tla2sany/parser/TLAplusParser.java#SomeFixDecl"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE parameter_infix_no_extends ----
Op(_ + _, a, b) == a + b
Test == Op(LAMBDA x, y : y, 1, 2) = 2
====

(*--- recorded
all:
  exit: 0
---*)
