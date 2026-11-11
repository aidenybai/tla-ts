(*---
description: Real behaves as any string, so Len and \o apply to it.
ref: tla2sany/StandardModules/Reals.tla#Real
features:
  - Reals
flags:
  - expression
outcome: success
---*)
---- MODULE real_is_an_ordinary_string ----
EXTENDS Reals, Sequences
Test == Len(Real) = 5 /\ Real \o "!" = "Reals!"
====

(*--- recorded
all:
  exit: 0
---*)
