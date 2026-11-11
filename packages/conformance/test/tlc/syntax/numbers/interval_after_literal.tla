(*---
description: "1..3 lexes as a number, .., and a number: the number lexer does not take the dot."
ref: "tla2sany/parser/TLAplusParser.java#Number"
features: [numbers]
flags: [expression]
outcome: success
---*)
---- MODULE interval_after_literal ----
EXTENDS Naturals
Test == 1..3 = {1, 2, 3}
====

(*--- recorded
all:
  exit: 0
---*)
