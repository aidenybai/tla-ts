(*---
description: A list may be the right operand of = and it is grouped first.
ref: "tla2sany/parser/TLAplusParser.java#Junctions"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE list_as_right_operand_of_equals ----
Test == TRUE = /\ TRUE
               /\ TRUE
====

(*--- recorded
all:
  exit: 0
---*)
