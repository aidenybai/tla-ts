(*---
description: "-(x) with one argument is prefix minus, from Integers."
ref: "tla2sany/parser/TLAplusParser.java#OpArgs"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE nonfix_standard_binary_minus_as_prefix ----
EXTENDS Integers
Test == -(1) = 0 - 1
====

(*--- recorded
all:
  exit: 0
---*)
