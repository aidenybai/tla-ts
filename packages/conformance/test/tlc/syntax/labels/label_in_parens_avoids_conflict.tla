(*---
description: Parentheses let a label hold a looser expression.
ref: "tla2sany/parser/TLAplusParser.java#labelDoesNotChangeParse"
features: [labels]
flags: [expression]
outcome: success
---*)
---- MODULE label_in_parens_avoids_conflict ----
EXTENDS Naturals
Op == 2 * (l:: 3 + 4)
Test == Op = 14 /\ Op!l = 7
====

(*--- recorded
all:
  exit: 0
---*)
