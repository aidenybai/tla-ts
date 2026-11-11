(*---
description: A list can be a record field.
ref: "tla2sany/parser/TLAplusParser.java#Junctions"
features: [junctions]
flags: [expression]
outcome: success
---*)
---- MODULE list_in_record_field ----
Test == [a |-> /\ TRUE
               /\ TRUE].a
====

(*--- recorded
all:
  exit: 0
---*)
