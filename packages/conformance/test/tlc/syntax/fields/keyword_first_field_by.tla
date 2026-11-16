(*---
description: BY may be the first field in a record constructor and the name after a dot.
ref: "tla2sany/parser/TLAplusParser.java#isFieldNameToken"
features: [fields]
flags: [expression]
outcome: success
---*)
---- MODULE keyword_first_field_by ----
Test == [BY |-> 3].BY = 3
====

(*--- recorded
all:
  exit: 0
---*)
