(*---
description: "A list may be the right operand of =>."
ref: "tla2sany/parser/TLAplusParser.java#Junctions"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE list_as_right_operand_of_implies ----
Test == FALSE => /\ FALSE
                 /\ FALSE
====

(*--- recorded
all:
  exit: 0
---*)
