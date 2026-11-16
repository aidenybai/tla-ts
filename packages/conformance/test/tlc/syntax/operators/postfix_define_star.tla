(*---
description: "a ^* == ... defines the postfix operator ^*."
ref: "tla2sany/parser/TLAplusParser.java#PostfixLHS"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE postfix_define_star ----
a ^* == <<a>>
Test == 5^* = <<5>>
====

(*--- recorded
all:
  exit: 0
---*)
