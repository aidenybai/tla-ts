(*---
description: A LOCAL definition of an extended module stays in scope in the extending module, and is expanded where it is used. TLA+ does not export LOCAL definitions, but Module.Flatten.exports keeps them and only marks them builtin (src/module/m_flatten.ml#exports).
ref: src/module/m_flatten.ml#exports
features: [tlapm-bug]
includes: [LocalLib.tla]
mode: obligations
outcome: proved
---*)
---- MODULE local_definition_extended ----
EXTENDS LocalLib
THEOREM Hidden = 1
  OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 12:3:12:10
    @status: to be proved
    @obl: 1 = 1

    @type: obligationsnumber
    @count: 1
---*)
