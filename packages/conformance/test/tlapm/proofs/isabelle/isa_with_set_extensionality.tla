(*---
description: IsaWithSetExtensionality runs auto with the setEqualI rule, which proves set equality from extensionality.
ref: src/backend/prep.ml#compute_meth
mode: proof
outcome: proved
---*)
---- MODULE isa_with_set_extensionality ----
EXTENDS TLAPS
THEOREM ASSUME NEW S, NEW T, \A x : x \in S <=> x \in T PROVE S = T
  BY IsaWithSetExtensionality
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 10:3:10:5
    @status: proved
    @prover: isabelle
    @meth: (auto intro: setEqualI); time-limit: 30
    @already: false

    @type: obligation
    @id: 2
    @loc: 10:6:10:30
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 10:6:10:30
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./isa_with_set_extensionality.tla", line 7, character 1 to line 11, character 4:
    [INFO]: All 2 obligations proved.
---*)
