(*---
description: A Unicode symbol may be declared as an infix parameter.
ref: "tla2sany/parser/TLAplusParser.java#SomeFixDecl"
features: [unicode]
flags: [expression]
outcome: success
---*)
---- MODULE parameter_infix_decl ----
Op(_ ⊕ _) == 1 ⊕ 2
Test == Op(LAMBDA a, b : b) = 2
====

(*--- recorded
all:
  exit: 0
---*)
