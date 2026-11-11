(*---
description: A definition of -. is also reached through -.(x).
ref: "tla2sany/parser/TLAplusParser.java#PrefixLHS"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE prefix_minus_define_nonfix_use ----
-. a == <<a>>
Test == -.(5) = <<5>>
====

(*--- recorded
all:
  exit: 0
---*)
