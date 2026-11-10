(*---
description: "@ is in scope in a quantifier inside an EXCEPT value."
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
flags: [expression]
outcome: success
---*)
---- MODULE at_in_quantifier_inside_except ----
Test == [<<1>> EXCEPT ![1] = \A x \in {1} : x = @] = <<TRUE>>
====

(*--- recorded
all:
  exit: 0
---*)
