(*---
description: "..(a, b) applies a user definition of .. in nonfix form."
ref: "tla2sany/parser/TLAplusParser.java#OpArgs"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE nonfix_user_dotdot ----
a .. b == <<a, b>>
Test == ..(1, 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
