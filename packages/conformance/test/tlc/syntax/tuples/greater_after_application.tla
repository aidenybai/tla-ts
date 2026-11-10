(*---
description: "> after a tuple application is plain greater-than."
ref: "tla2sany/parser/TLAplusParser.java#TupleOrAction"
features: [tuples]
flags: [expression]
outcome: success
---*)
---- MODULE greater_after_application ----
EXTENDS Naturals
Test == <<1,2>>[2]>1
====

(*--- recorded
all:
  exit: 0
---*)
