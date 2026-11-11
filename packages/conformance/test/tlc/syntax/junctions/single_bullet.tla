(*---
description: "A list with one bullet is that item's value."
ref: "tla2sany/parser/TLAplusParser.java#Junctions"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE single_bullet ----
Test == /\ TRUE
====

(*--- recorded
all:
  exit: 0
---*)
