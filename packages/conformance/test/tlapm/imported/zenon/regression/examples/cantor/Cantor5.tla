(*---
description: Zenon's regression test zenon/regression/examples/cantor/Cantor5.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/examples/cantor/Cantor5.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
(* Contributed by Damien Doligez *)

-------------- MODULE Cantor5 ------------------
THEOREM cantor ==
  \A S, f :
    \E A \in SUBSET S :
      \A x \in S :
        f [x] # A
PROOF
  <1>1. ASSUME
          NEW S,
          NEW f
        PROVE \E A \in SUBSET S : \A x \in S : f[x] # A
    PROOF
    <2> WITNESS { z \in S : z \notin f[z] } \in SUBSET S
    <2> QED OBVIOUS
  <1> QED BY <1>1 DEF cantor
===============================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 28:11:28:13
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 28:11:28:13
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 28:14:28:18
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 28:14:28:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 27:13:27:20
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 27:13:27:20
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 4
    @loc: 26:5:26:57
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 26:5:26:57
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 5
    @loc: 26:5:26:57
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 26:5:26:57
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 6
    @loc: 26:5:26:57
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 26:5:26:57
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 7
    @loc: 26:17:26:57
    @status: to be proved

    @type: obligation
    @id: 7
    @loc: 26:17:26:57
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 8
    @loc: 26:17:26:57
    @status: to be proved

    @type: obligation
    @id: 8
    @loc: 26:17:26:57
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligationsnumber
    @count: 8

    File "./Cantor5.tla", line 14, character 1 to line 29, character 47:
    [INFO]: All 8 obligations proved.
---*)
