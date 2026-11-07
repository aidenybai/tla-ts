(*---
description: Zenon's regression test zenon/regression/sets/singleton.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/sets/singleton.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
---- MODULE singleton ----
THEOREM foo == \A x : \E S : x \in S
OBVIOUS
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 14:1:14:8
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 14:1:14:8
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./singleton.tla", line 12, character 1 to line 15, character 4:
    [INFO]: All 1 obligation proved.
---*)
