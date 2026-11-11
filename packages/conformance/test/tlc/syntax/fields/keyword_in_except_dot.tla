(*---
description: "A keyword is allowed after !. in an EXCEPT."
ref: "tla2sany/parser/TLAplusParser.java#ExceptComponent"
features: [fields]
flags: [expression]
outcome: success
---*)
---- MODULE keyword_in_except_dot ----
Test == [[THEN |-> 1] EXCEPT !.THEN = 2].THEN = 2
====

(*--- recorded
all:
  exit: 0
---*)
