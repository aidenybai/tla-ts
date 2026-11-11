(*---
description: "A bare underscore is a legal first field and dot name, since the US token counts as a field name token."
ref: "tla2sany/parser/TLAplusParser.java#isFieldNameToken"
features: [fields]
flags: [expression]
outcome: success
---*)
---- MODULE underscore_field ----
Test == [_ |-> 3]._ = 3
====

(*--- recorded
all:
  exit: 0
---*)
