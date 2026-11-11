(*---
description: Dot selection allows keywords after the dot on any record.
ref: "tla2sany/parser/TLAplusParser.java#isFieldNameToken"
features: [fields]
flags: [expression]
outcome: success
---*)
---- MODULE keyword_dot_on_plain_record ----
EXTENDS TLC
Test == ("IF" :> 3).IF = 3
====

(*--- recorded
all:
  exit: 0
---*)
