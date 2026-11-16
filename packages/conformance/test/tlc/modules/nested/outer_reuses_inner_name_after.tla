(*---
description: "Outer definitions may reuse a name inner defined, since an uninstanced nested module adds nothing to the outer scope."
ref: "tla2sany/semantic/Generator.java#generateModule"
features: [nested]
flags: [expression]
outcome: success
---*)
---- MODULE outer_reuses_inner_name_after ----
---- MODULE I ----
A == 8
====
A == 7
Test == A = 7
====

(*--- recorded
all:
  exit: 0
---*)
