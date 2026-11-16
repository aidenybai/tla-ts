(*---
description: LEMMA may be the first field in a record constructor and the name after a dot.
ref: "tla2sany/parser/TLAplusParser.java#isFieldNameToken"
features: [fields]
flags: [expression]
contexts: [assume]
outcome: success
---*)
---- MODULE keyword_first_field_lemma ----
Test == [LEMMA |-> 3].LEMMA = 3
====

(*--- recorded
all:
  exit: 0
---*)
