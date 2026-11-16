(*---
description: Zenon's regression test zenon/regression/examples/cantor/Cantor6.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/examples/cantor/Cantor6.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
(* Contributed by Damien Doligez *)

-------------- MODULE Cantor6 ------------------
THEOREM cantor ==
  \A S, f :
    \E A \in SUBSET S :
      \A x \in S :
        f [x] # A
PROOF
  <1> USE DEF cantor
  <1> TAKE S
  <1> TAKE f
  <1> WITNESS { z \in S : z \notin f[z] } \in SUBSET S
  <1> QED OBVIOUS
===============================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 25:11:25:18
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 25:11:25:18
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 22:3:22:13
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 22:3:22:13
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 3
    @loc: 22:3:22:13
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 22:3:22:13
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 4
    @loc: 23:3:23:13
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 23:3:23:13
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 5
    @loc: 23:3:23:13
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 23:3:23:13
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 6
    @loc: 24:3:24:55
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 24:3:24:55
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 7
    @loc: 24:3:24:55
    @status: to be proved

    @type: obligation
    @id: 7
    @loc: 24:3:24:55
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 8
    @loc: 24:3:24:55
    @status: to be proved

    @type: obligation
    @id: 8
    @loc: 24:3:24:55
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 9
    @loc: 24:15:24:55
    @status: to be proved

    @type: obligation
    @id: 9
    @loc: 24:15:24:55
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 10
    @loc: 24:15:24:55
    @status: to be proved

    @type: obligation
    @id: 10
    @loc: 24:15:24:55
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligationsnumber
    @count: 10

    File "./Cantor6.tla", line 14, character 1 to line 26, character 47:
    [INFO]: All 10 obligations proved.
---*)
