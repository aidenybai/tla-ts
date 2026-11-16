(*---
description: _ ^+ declares a postfix parameter.
ref: "tla2sany/parser/TLAplusParser.java#SomeFixDecl"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE parameter_postfix_decl ----
Op(_ ^+, a) == a ^+
Test == Op(LAMBDA x : <<x>>, 1) = <<1>>
====

(*--- recorded
all:
  exit: 0
---*)
