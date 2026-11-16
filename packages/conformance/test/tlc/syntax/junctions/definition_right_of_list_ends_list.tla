(*---
description: The next definition ends the list even when indented past its bullets.
ref: "tla2sany/parser/TLAplusParser.java#belchDEF"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE definition_right_of_list_ends_list ----
Op == /\ TRUE
      /\ TRUE
         Test == Op
====

(*--- recorded
all:
  exit: 0
---*)
