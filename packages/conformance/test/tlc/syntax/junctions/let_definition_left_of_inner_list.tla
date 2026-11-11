(*---
description: "A LET definition's body holds its own list, closed by IN."
ref: "tla2sany/parser/TLAplusParser.java#LetIn"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE let_definition_left_of_inner_list ----
Test ==
  LET a == /\ TRUE
           /\ TRUE
  IN a
====

(*--- recorded
all:
  exit: 0
---*)
