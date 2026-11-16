(*---
description: Zenon's regression test zenon/regression/examples/cantor/Cantor2.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/examples/cantor/Cantor2.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
(* Contributed by Leslie Lamport *)

-------------- MODULE Cantor2 ------------------
THEOREM cantor ==
  \A S :
    \A f \in [S -> SUBSET S] :
      \E A \in SUBSET S :
        \A x \in S :
          f [x] # A
PROOF
  <1>1. SUFFICES ASSUME NEW S,
                        NEW f \in [S -> SUBSET S]
                 PROVE  \E A \in SUBSET S :
                          \A x \in S : f [x] # A
        BY DEF cantor
  <1>2. DEFINE T == {z \in S : z \notin f [z]}
  <1>3. SUFFICES ASSUME NEW x \in S
                 PROVE  f[x] # T
        PROOF
          <2>1. WITNESS T \in SUBSET S
          <2>2. QED
                PROOF OBVIOUS
  <1>4. CASE x \in T
        PROOF
          <2>1. x \notin f [x] BY <1>4
          <2>2. QED BY <2>1
  <1>5. CASE x \notin T
        PROOF
          <2>1. x \in f [x] BY <1>5
          <2>2. QED BY <2>1
  <1>6. QED
        PROOF BY <1>4, <1>5
===============================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 43:15:43:17
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 43:15:43:17
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 43:18:43:22
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 43:18:43:22
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 43:24:43:28
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 43:24:43:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 4
    @loc: 26:9:26:11
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 26:9:26:11
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 5
    @loc: 33:23:33:30
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 33:23:33:30
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 6
    @loc: 31:11:31:39
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 31:11:31:39
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 7
    @loc: 31:11:31:39
    @status: to be proved

    @type: obligation
    @id: 7
    @loc: 31:11:31:39
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 8
    @loc: 31:11:31:39
    @status: to be proved

    @type: obligation
    @id: 8
    @loc: 31:11:31:39
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 9
    @loc: 31:25:31:39
    @status: to be proved

    @type: obligation
    @id: 9
    @loc: 31:25:31:39
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 10
    @loc: 31:25:31:39
    @status: to be proved

    @type: obligation
    @id: 10
    @loc: 31:25:31:39
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 11
    @loc: 37:21:37:23
    @status: to be proved

    @type: obligation
    @id: 11
    @loc: 37:21:37:23
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 12
    @loc: 37:24:37:28
    @status: to be proved

    @type: obligation
    @id: 12
    @loc: 37:24:37:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 13
    @loc: 36:32:36:34
    @status: to be proved

    @type: obligation
    @id: 13
    @loc: 36:32:36:34
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 14
    @loc: 36:35:36:39
    @status: to be proved

    @type: obligation
    @id: 14
    @loc: 36:35:36:39
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 15
    @loc: 41:21:41:23
    @status: to be proved

    @type: obligation
    @id: 15
    @loc: 41:21:41:23
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 16
    @loc: 41:24:41:28
    @status: to be proved

    @type: obligation
    @id: 16
    @loc: 41:24:41:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 17
    @loc: 40:29:40:31
    @status: to be proved

    @type: obligation
    @id: 17
    @loc: 40:29:40:31
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 18
    @loc: 40:32:40:36
    @status: to be proved

    @type: obligation
    @id: 18
    @loc: 40:32:40:36
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 18

    File "./Cantor2.tla", line 14, character 1 to line 44, character 47:
    [INFO]: All 18 obligations proved.
---*)
