(*---
description: "A list may follow ~, and ~ applies to the whole list."
ref: "tla2sany/parser/TLAplusParser.java#Junctions"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE list_as_operand_of_not ----
Test == ~ /\ TRUE
          /\ FALSE
====

(*--- recorded
all:
  exit: 0
---*)
