(*---
description: "TRUE at the start with /\\ on later lines is plain infix, not a list."
ref: "tla2sany/parser/TLAplusParser.java#Expression"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE infix_leading_list_lookalike ----
Test == ~ (TRUE
  /\ FALSE
  /\ TRUE)
====

(*--- recorded
all:
  exit: 0
---*)
