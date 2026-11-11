(*---
description: ASSUME may be the first field in a record constructor and the name after a dot.
ref: "tla2sany/parser/TLAplusParser.java#isFieldNameToken"
features: [fields]
flags: [expression]
outcome: success
---*)
---- MODULE keyword_first_field_assume ----
Test == [ASSUME |-> 3].ASSUME = 3
====

(*--- recorded
all:
  exit: 0
---*)
