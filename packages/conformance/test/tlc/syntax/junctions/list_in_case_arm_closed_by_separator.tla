(*---
description: "A [] ends a list inside a CASE arm."
ref: "tla2sany/parser/TLAplusParser.java#caseSep"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE list_in_case_arm_closed_by_separator ----
Test == CASE /\ FALSE
             /\ TRUE -> FALSE
          [] OTHER -> TRUE
====

(*--- recorded
all:
  exit: 0
---*)
