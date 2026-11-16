(*---
description: Zenon's regression test zenon/regression/examples/cantor/Cantor3.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/examples/cantor/Cantor3.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
(* Contributed by Leslie Lamport *)

-------------- MODULE Cantor3 ------------------
THEOREM cantor ==
  \A S :
    \A f \in [S -> SUBSET S] :
      \E A \in SUBSET S :
        \A x \in S :
          f [x] # A
PROOF
  <1>1. ASSUME NEW S,
               NEW f \in [S -> SUBSET S]
        PROVE  \E A \in SUBSET S :
                    \A x \in S : f [x] # A
     PROOF
       <2>1. DEFINE T == {z \in S : z \notin f [z]}
       <2>2. \A x \in S : f [x] # T
         PROOF
           <3>1. ASSUME NEW x \in S
                 PROVE  f[x] # T
             PROOF
              <4>1. CASE x \in T
                   PROOF
                     <5>1. x \notin f [x]
                           BY <4>1
                     <5>2. QED BY <5>1
              <4>2. CASE x \notin T
                    PROOF
                      <5>1. x \in f [x]
                            BY <4>2
                      <5>2. QED BY <5>1

              <4>3. QED
                    BY <4>1, <4>2
          <3>2. QED BY <3>1
      <2>3. QED
         PROOF
           <3>1. WITNESS T \in SUBSET S
           <3>2. QED BY <2>2
  <1>2. QED
         PROOF BY <1>1 DEF cantor
===============================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 52:16:52:18
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 52:16:52:18
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 52:19:52:23
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 52:19:52:23
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 50:22:50:24
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 50:22:50:24
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 4
    @loc: 50:25:50:29
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 50:25:50:29
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 5
    @loc: 49:12:49:40
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 49:12:49:40
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 6
    @loc: 49:12:49:40
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 49:12:49:40
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 7
    @loc: 49:12:49:40
    @status: to be proved

    @type: obligation
    @id: 7
    @loc: 49:12:49:40
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 8
    @loc: 49:26:49:40
    @status: to be proved

    @type: obligation
    @id: 8
    @loc: 49:26:49:40
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 9
    @loc: 49:26:49:40
    @status: to be proved

    @type: obligation
    @id: 9
    @loc: 49:26:49:40
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 10
    @loc: 46:21:46:23
    @status: to be proved

    @type: obligation
    @id: 10
    @loc: 46:21:46:23
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 11
    @loc: 46:24:46:28
    @status: to be proved

    @type: obligation
    @id: 11
    @loc: 46:24:46:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 12
    @loc: 45:21:45:23
    @status: to be proved

    @type: obligation
    @id: 12
    @loc: 45:21:45:23
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 13
    @loc: 45:24:45:28
    @status: to be proved

    @type: obligation
    @id: 13
    @loc: 45:24:45:28
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 14
    @loc: 45:30:45:34
    @status: to be proved

    @type: obligation
    @id: 14
    @loc: 45:30:45:34
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 15
    @loc: 37:32:37:34
    @status: to be proved

    @type: obligation
    @id: 15
    @loc: 37:32:37:34
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 16
    @loc: 37:35:37:39
    @status: to be proved

    @type: obligation
    @id: 16
    @loc: 37:35:37:39
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 17
    @loc: 36:28:36:30
    @status: to be proved

    @type: obligation
    @id: 17
    @loc: 36:28:36:30
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 18
    @loc: 36:31:36:35
    @status: to be proved

    @type: obligation
    @id: 18
    @loc: 36:31:36:35
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 19
    @loc: 42:33:42:35
    @status: to be proved

    @type: obligation
    @id: 19
    @loc: 42:33:42:35
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 20
    @loc: 42:36:42:40
    @status: to be proved

    @type: obligation
    @id: 20
    @loc: 42:36:42:40
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 21
    @loc: 41:29:41:31
    @status: to be proved

    @type: obligation
    @id: 21
    @loc: 41:29:41:31
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 22
    @loc: 41:32:41:36
    @status: to be proved

    @type: obligation
    @id: 22
    @loc: 41:32:41:36
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 22

    File "./Cantor3.tla", line 14, character 1 to line 53, character 47:
    [INFO]: All 22 obligations proved.
---*)
