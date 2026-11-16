(*---
description: "\\div(a, b) applies a user definition of \\div in nonfix form."
ref: "tla2sany/parser/TLAplusParser.java#OpArgs"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE nonfix_user_div ----
a \div b == <<a, b>>
Test == \div(1, 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
