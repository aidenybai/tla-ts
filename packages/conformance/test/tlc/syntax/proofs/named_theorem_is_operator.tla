(*---
description: "A named theorem may be evaluated as an expression, even though the theorem itself is not checked."
ref: "tlc2/tool/impl/SpecProcessor.java#processConstants"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE named_theorem_is_operator ----
THEOREM T == 1 = 1
Test == T
====

(*--- recorded
all:
  exit: 0
---*)
