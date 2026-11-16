(*---
description: THEN may be the first field in a record constructor and the name after a dot.
ref: "tla2sany/parser/TLAplusParser.java#isFieldNameToken"
features: [fields]
flags: [expression]
outcome: success
---*)
---- MODULE keyword_first_field_then ----
Test == [THEN |-> 3].THEN = 3
====

(*--- recorded
all:
  exit: 0
---*)
