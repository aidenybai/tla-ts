(*---
description: Zenon's regression test zenon/regression/backend/testbchoose.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/backend/testbchoose.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
---- MODULE testbchoose ----

THEOREM foo ==
  ASSUME NEW S, NEW v, NEW P(_),
         v \in S,
         P (v)
  PROVE P (CHOOSE x \in S : P (x))
OBVIOUS

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 19:1:19:8
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 19:1:19:8
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./testbchoose.tla", line 12, character 1 to line 21, character 4:
    [INFO]: All 1 obligation proved.
---*)
