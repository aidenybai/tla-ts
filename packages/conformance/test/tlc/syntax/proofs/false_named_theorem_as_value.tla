(*---
description: "A named false theorem evaluates to FALSE, without any failure from the theorem itself."
ref: "tlc2/tool/impl/SpecProcessor.java#processConstants"
features: [proofs]
flags: [expression]
outcome: success
---*)
---- MODULE false_named_theorem_as_value ----
THEOREM T == 1 = 2
Test == ~T
====

(*--- recorded
all:
  exit: 0
---*)
