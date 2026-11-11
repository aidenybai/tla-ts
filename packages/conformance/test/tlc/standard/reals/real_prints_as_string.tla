(*---
description: PrintT(Real) prints the quoted string.
ref: tla2sany/StandardModules/Reals.tla#Real
features:
  - Reals
flags:
  - expression
outcome: success
---*)
---- MODULE real_prints_as_string ----
EXTENDS Reals, TLC
Test == PrintT(Real)
====

(*--- recorded
all:
  exit: 0
  transcript: '| "Reals"'
---*)
