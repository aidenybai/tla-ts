(*---
description: A config substitution replaces _TETrace, an operator defined in an extended module.
ref: tla2sany/StandardModules/Toolbox.tla#_TETrace
features:
  - Toolbox
flags:
  - expression
outcome: success
config: |
  CONSTANT _TETrace <- Trc
---*)
---- MODULE tetrace_override ----
EXTENDS Toolbox
Trc == <<"a", "b">>
Test == _TETrace = <<"a", "b">>
====

(*--- recorded
all:
  exit: 0
---*)
