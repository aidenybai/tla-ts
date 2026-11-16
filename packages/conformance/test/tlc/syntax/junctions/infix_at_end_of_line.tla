(*---
description: "An infix /\\ may end a line outside any list."
ref: "tla2sany/parser/TLAplusParser.java#Expression"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE infix_at_end_of_line ----
Test == TRUE /\
TRUE
====

(*--- recorded
all:
  exit: 0
---*)
