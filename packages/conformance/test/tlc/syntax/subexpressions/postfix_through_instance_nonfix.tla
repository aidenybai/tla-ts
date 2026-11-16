(*---
description: "An instance's postfix operator may be applied in nonfix form."
ref: "tla2sany/parser/TLAplusParser.java#BangExt"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE postfix_through_instance_nonfix ----
---- MODULE I ----
a ^+ == <<a>>
====
M == INSTANCE I
Test == M!^+(1) = <<1>>
====

(*--- recorded
all:
  exit: 0
---*)
