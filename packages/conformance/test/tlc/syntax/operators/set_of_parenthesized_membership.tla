(*---
description: "{(x \\in S)} with parentheses is a one-element enumeration of a membership test."
ref: "tla2sany/parser/TLAplusParser.java#matchFcnConst"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE set_of_parenthesized_membership ----
x == 1
Test == {(x \in {1})} = {TRUE}
====

(*--- recorded
all:
  exit: 0
---*)
