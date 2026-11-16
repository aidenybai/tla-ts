(*---
description: _TEPosition is 1 at level 0 and at level 1 for a two-step trace, in every context.
ref: tla2sany/StandardModules/Toolbox.tla#_TEPosition
features:
  - Toolbox
flags:
  - expression
outcome: success
config: |
  CONSTANT _TETrace <- Trc
---*)
---- MODULE teposition_level_zero_or_one ----
EXTENDS Toolbox
Trc == <<"a", "b">>
Test == _TEPosition = 1
====

(*--- recorded
all:
  exit: 0
---*)
