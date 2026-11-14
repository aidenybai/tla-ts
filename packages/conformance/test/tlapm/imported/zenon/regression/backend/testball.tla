(*---
description: Zenon's regression test zenon/regression/backend/testball.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/backend/testball.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
---- MODULE testball ----

THEOREM foo ==
  ASSUME NEW S
  PROVE \A x \in S : x \in S
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

    File "./testball.tla", line 12, character 1 to line 19, character 4:
    [INFO]: All 1 obligation proved.
---*)
