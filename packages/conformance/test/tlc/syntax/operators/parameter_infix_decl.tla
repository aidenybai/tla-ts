(*---
description: "_+_ declares an infix parameter, which the body applies infix."
ref: "tla2sany/parser/TLAplusParser.java#SomeFixDecl"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE parameter_infix_decl ----
Op(_ ++ _, a, b) == a ++ b
Test == Op(LAMBDA x, y : <<x, y>>, 1, 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
