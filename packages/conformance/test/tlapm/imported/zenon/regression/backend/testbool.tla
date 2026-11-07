(*---
description: Zenon's regression test zenon/regression/backend/testbool.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/backend/testbool.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
---- MODULE testbool ----

THEOREM foo ==
  ASSUME NEW x \in BOOLEAN
  PROVE x = TRUE \/ x = FALSE
OBVIOUS

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 17:1:17:8
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 17:1:17:8
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./testbool.tla", line 12, character 1 to line 19, character 4:
    [INFO]: All 1 obligation proved.
---*)
