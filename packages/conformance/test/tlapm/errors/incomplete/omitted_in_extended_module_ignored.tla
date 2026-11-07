(*---
description: An omitted proof in an extended module is not counted, since tlapm generates obligations only for the files it is given.
ref: src/proof/p_gen.ml#generate
includes: [OmittedLib.tla]
mode: obligations
outcome: proved
---*)
---- MODULE omitted_in_extended_module_ignored ----
EXTENDS OmittedLib
THEOREM TRUE BY L
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:14:10:16
    @status: to be proved
    @obl: ASSUME L 
    PROVE  TRUE

    @type: obligation
    @id: 2
    @loc: 10:17:10:18
    @status: to be proved
    @obl: L

    @type: obligationsnumber
    @count: 2
---*)
