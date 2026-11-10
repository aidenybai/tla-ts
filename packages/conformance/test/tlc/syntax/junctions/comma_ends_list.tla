(*---
description: "A comma ends a list, so a tuple can hold two lists at the same column."
ref: "tla2sany/parser/TLAplusParser.java#Junctions"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE comma_ends_list ----
Test == <<
  /\ TRUE
  /\ FALSE ,
  /\ TRUE
  >> = <<FALSE, TRUE>>
====

(*--- recorded
all:
  exit: 0
---*)
