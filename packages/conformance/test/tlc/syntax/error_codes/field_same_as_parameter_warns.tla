(*---
description: "A record field equal to a parameter's name only warns, and the value expression sees the parameter."
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
flags: [expression]
outcome: success
---*)
---- MODULE field_same_as_parameter_warns ----
F(x) == [x |-> x]
Test == F(2).x = 2
====

(*--- recorded
all:
  exit: 0
---*)
