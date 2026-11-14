(*---
description: Zenon's regression test zenon/regression/examples/cantor/Cantor1.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/examples/cantor/Cantor1.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
(* Contributed by Damien Doligez *)

-------------- MODULE Cantor1 ------------------
THEOREM cantor ==
  \A S :
    \A f \in [S -> SUBSET S] :
      \E A \in SUBSET S :
        \A x \in S :
          f [x] # A
PROOF
  <1>. USE DEF cantor
  <1>2. TAKE S
  <1>3. TAKE f \in [S -> SUBSET S]
  <1>4. DEFINE T == { z \in S : z \notin f[z] }
  <1>5. WITNESS T \in SUBSET S
  <1>6. TAKE x \in S
  <1>7. QED BY x \in T \/ x \notin T
===============================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 28:13:28:15
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 28:13:28:15
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 28:16:28:37
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 28:16:28:37
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 3
    @loc: 23:3:23:15
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 23:3:23:15
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 4
    @loc: 23:3:23:15
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 23:3:23:15
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 5
    @loc: 24:3:24:35
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 24:3:24:35
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 6
    @loc: 24:3:24:35
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 24:3:24:35
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 7
    @loc: 26:3:26:31
    @status: to be proved

    @type: obligation
    @id: 7
    @loc: 26:3:26:31
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 8
    @loc: 26:3:26:31
    @status: to be proved

    @type: obligation
    @id: 8
    @loc: 26:3:26:31
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 9
    @loc: 26:3:26:31
    @status: to be proved

    @type: obligation
    @id: 9
    @loc: 26:3:26:31
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 10
    @loc: 26:17:26:31
    @status: to be proved

    @type: obligation
    @id: 10
    @loc: 26:17:26:31
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 11
    @loc: 26:17:26:31
    @status: to be proved

    @type: obligation
    @id: 11
    @loc: 26:17:26:31
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 12
    @loc: 27:3:27:21
    @status: to be proved

    @type: obligation
    @id: 12
    @loc: 27:3:27:21
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 13
    @loc: 27:3:27:21
    @status: to be proved

    @type: obligation
    @id: 13
    @loc: 27:3:27:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 13

    File "./Cantor1.tla", line 14, character 1 to line 29, character 47:
    [INFO]: All 13 obligations proved.
---*)
