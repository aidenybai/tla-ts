(*---
description: Two theorems with the same name are accepted, and each gets its own obligation. tlapm leaves multiple definitions to SANY.
ref: src/module/m_elab.ml#normalize
mode: obligations
outcome: proved
---*)
---- MODULE duplicate_theorem_name_accepted ----
THEOREM T == TRUE OBVIOUS
THEOREM T == TRUE OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 8:19:8:26
    @status: to be proved
    @obl: TRUE

    @type: obligation
    @id: 2
    @loc: 9:19:9:26
    @status: to be proved
    @obl: TRUE

    @type: obligationsnumber
    @count: 2
---*)
