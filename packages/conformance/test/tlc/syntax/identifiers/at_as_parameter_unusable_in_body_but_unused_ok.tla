(*---
description: "@ may be a formal parameter name if the body does not use it."
ref: "tla2sany/semantic/Generator.java#processOperator"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE at_as_parameter_unusable_in_body_but_unused_ok ----
Op(@) == 1
Test == Op(2) = 1
====

(*--- recorded
all:
  exit: 0
---*)
