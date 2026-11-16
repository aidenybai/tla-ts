(*---
description: "-. a == ... defines prefix minus, used as -x."
ref: "tla2sany/parser/TLAplusParser.java#PrefixLHS"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE prefix_minus_define ----
-. a == <<a>>
Test == -5 = <<5>>
====

(*--- recorded
all:
  exit: 0
---*)
