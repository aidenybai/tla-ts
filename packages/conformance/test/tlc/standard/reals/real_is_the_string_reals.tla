(*---
description: No Java class overrides Reals, so Real evaluates to its dummy definition, the string "Reals".
ref: tla2sany/StandardModules/Reals.tla#Real
features:
  - Reals
flags:
  - expression
outcome: success
---*)
---- MODULE real_is_the_string_reals ----
EXTENDS Reals
Test == Real = "Reals"
====

(*--- recorded
all:
  exit: 0
---*)
