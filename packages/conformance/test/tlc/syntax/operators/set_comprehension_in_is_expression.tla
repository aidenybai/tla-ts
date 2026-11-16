(*---
description: "{1 \\in {1}} is a one-element set holding a Boolean, because a number cannot begin the x \\in S form."
ref: "tla2sany/parser/TLAplusParser.java#matchFcnConst"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE set_comprehension_in_is_expression ----
Test == {1 \in {1}} = {TRUE}
====

(*--- recorded
all:
  exit: 0
---*)
