(*---
description: A keyword is allowed in a later EXCEPT component.
ref: "tla2sany/parser/TLAplusParser.java#ExceptComponent"
features: [fields]
flags: [expression]
outcome: success
---*)
---- MODULE keyword_in_except_second_spec ----
Test == [[IF |-> 1, a |-> 2] EXCEPT !.a = 3, !.IF = 4].IF = 4
====

(*--- recorded
all:
  exit: 0
---*)
