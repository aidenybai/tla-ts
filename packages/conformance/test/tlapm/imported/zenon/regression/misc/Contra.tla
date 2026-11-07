(*---
description: Zenon's regression test zenon/regression/misc/Contra.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/misc/Contra.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
---- MODULE Contra ----

CONSTANT A

THEOREM A => ~ ~ A
PROOF
  <1>. HAVE A
  <1>. ASSUME ~ A
       PROVE FALSE
       <2>. A /\ ~ A OBVIOUS
       <2>. QED OBVIOUS
  <1>. QED OBVIOUS


====================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 23:12:23:19
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 23:12:23:19
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 18:3:18:14
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 18:3:18:14
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 3
    @loc: 18:3:18:14
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 18:3:18:14
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 4
    @loc: 22:17:22:24
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 22:17:22:24
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 5
    @loc: 21:22:21:29
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 21:22:21:29
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligationsnumber
    @count: 5

    File "./Contra.tla", line 12, character 1 to line 26, character 20:
    [INFO]: All 5 obligations proved.
---*)
