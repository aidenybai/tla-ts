(*---
description: ==== inside a string is text and does not end the module.
ref: "tla2sany/parser/TLAplusParser.java#reduceString"
features: [strings]
flags: [expression]
outcome: success
---*)
---- MODULE module_end_inside ----
EXTENDS Sequences, TLC
Test == Len("= = =") = 5
====

(*--- recorded
all:
  exit: 0
---*)
