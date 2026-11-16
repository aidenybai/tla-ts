(*---
description: "A list may be an IF condition, ended by THEN."
ref: "tla2sany/parser/TLAplusParser.java#IfThenElse"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE list_in_if_condition ----
Test == IF /\ TRUE
           /\ TRUE THEN TRUE ELSE FALSE
====

(*--- recorded
all:
  exit: 0
---*)
