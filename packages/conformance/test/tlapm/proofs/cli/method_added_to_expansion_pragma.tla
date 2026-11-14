(*---
description: When BY cites only an expansion pragma, the methods of --method are added, so Zenon runs.
ref: src/backend/prep.ml#find_meth
mode: proof
args: ['--method', zenon]
outcome: proved
---*)
---- MODULE method_added_to_expansion_pragma ----
EXTENDS Naturals, TLAPS
THEOREM ASSUME NEW P, NEW Q, P /\ Q PROVE Q /\ P
  BY ExpandENABLED
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 11:6:11:19
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:19
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./method_added_to_expansion_pragma.tla", line 8, character 1 to line 12, character 4:
    [INFO]: All 2 obligations proved.
---*)
