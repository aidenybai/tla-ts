(*---
description: "A math symbol inside a string is text, not an operator."
ref: "tla2sany/parser/TLAplusParser.java#reduceString"
features: [strings]
flags: [expression]
outcome: success
---*)
---- MODULE unicode_math_is_literal ----
EXTENDS Sequences, TLC
Test == "∧" # "/\\" /\ Len("∧") = 1
====

(*--- recorded
all:
  exit: 0
---*)
