(*---
description: Zenon's regression test zenon/regression/examples/cantor/Cantor7.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/examples/cantor/Cantor7.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
(* Contributed by Damien Doligez *)

-------------- MODULE Cantor7 ------------------
THEOREM cantor ==
  \A S, f :
    \E A \in SUBSET S :
      \A x \in S :
        f [x] # A
PROOF
  <1> SUFFICES ASSUME
        NEW S,
        NEW f
      PROVE \E A \in SUBSET S : \A x \in S : f[x] # A
    BY DEF cantor
  <1> WITNESS { z \in S : z \notin f[z] } \in SUBSET S
  <1> QED OBVIOUS
===============================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 27:11:27:18
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 27:11:27:18
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 25:5:25:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 25:5:25:7
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 3
    @loc: 26:3:26:55
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 26:3:26:55
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 4
    @loc: 26:3:26:55
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 26:3:26:55
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 5
    @loc: 26:3:26:55
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 26:3:26:55
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 6
    @loc: 26:15:26:55
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 26:15:26:55
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 7
    @loc: 26:15:26:55
    @status: to be proved

    @type: obligation
    @id: 7
    @loc: 26:15:26:55
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligationsnumber
    @count: 7

    File "./Cantor7.tla", line 14, character 1 to line 28, character 47:
    [INFO]: All 7 obligations proved.
---*)
