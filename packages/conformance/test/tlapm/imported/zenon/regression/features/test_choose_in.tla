(*---
description: Zenon's regression test zenon/regression/features/test_choose_in.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/features/test_choose_in.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
---- MODULE test_choose_in ----

THEOREM CHOOSE x \in BOOLEAN : x = TRUE
OBVIOUS

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 15:1:15:8
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 15:1:15:8
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./test_choose_in.tla", line 12, character 1 to line 17, character 4:
    [INFO]: All 1 obligation proved.
---*)
