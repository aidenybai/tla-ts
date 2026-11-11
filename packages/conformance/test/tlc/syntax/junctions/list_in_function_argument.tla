(*---
description: A list can be a function argument.
ref: "tla2sany/parser/TLAplusParser.java#Junctions"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE list_in_function_argument ----
Test == [b \in BOOLEAN |-> b][/\ TRUE
                              /\ TRUE]
====

(*--- recorded
all:
  exit: 0
---*)
