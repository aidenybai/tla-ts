(*---
description: "@ is in scope in a LET inside an EXCEPT value."
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
flags: [expression]
outcome: success
---*)
---- MODULE at_in_let_inside_except ----
Test == [<<1>> EXCEPT ![1] = LET a == @ IN a] = <<1>>
====

(*--- recorded
all:
  exit: 0
---*)
