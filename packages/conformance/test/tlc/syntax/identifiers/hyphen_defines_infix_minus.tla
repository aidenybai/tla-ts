(*---
description: "a-b == ... defines the infix minus with parameters a and b, since a hyphen is never part of a name."
ref: "tla2sany/parser/TLAplusParser.java#InfixLHS"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE hyphen_defines_infix_minus ----
a-b == a
Test == 3-2 = 3
====

(*--- recorded
all:
  exit: 0
---*)
