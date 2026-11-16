(*---
description: A name with parameters is an ordinary nonfix definition.
ref: "tla2sany/parser/TLAplusParser.java#IdentLHS"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE define_nonfix_with_identifier_arity ----
F(a, b, c) == a
Test == F(1, 2, 3) = 1
====

(*--- recorded
all:
  exit: 0
---*)
