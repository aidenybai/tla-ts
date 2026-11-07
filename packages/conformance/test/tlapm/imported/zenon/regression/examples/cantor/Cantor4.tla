(*---
description: Zenon's regression test zenon/regression/examples/cantor/Cantor4.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/examples/cantor/Cantor4.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
(* Contributed by Stephan Merz *)
(* Modified into TLA+ proof language syntax *)

-------------- MODULE Cantor4 ------------------
THEOREM cantor ==
 \A S :
   \A f \in [S -> SUBSET S] :
     \E A \in SUBSET S :
       \A x \in S :
         f [x] # A
PROOF
 <1>. USE DEF cantor
 <1>. TAKE S
 <1>. TAKE f \in [S -> SUBSET S]
 <1>. DEFINE T == {z \in S : z \notin f[z]}
 <1>1. \A x \in S : f[x] # T
       PROOF
        <2>. TAKE x \in S
        <2>1. CASE x \in T
              PROOF
               <3>1. x \notin f[x] BY <2>1
               <3>2. QED BY <3>1
        <2>2. CASE x \notin T
              PROOF
               <3>1. x \in f[x] BY <2>2
               <3>2. QED BY <3>1
        <2>3. QED BY <2>1, <2>2
 <1>. WITNESS T \in SUBSET S
 <1>. QED BY <1>1
===============================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 40:11:40:13
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 40:11:40:13
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 40:14:40:18
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 40:14:40:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 24:2:24:13
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 24:2:24:13
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 4
    @loc: 24:2:24:13
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 24:2:24:13
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 5
    @loc: 25:2:25:33
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 25:2:25:33
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 6
    @loc: 25:2:25:33
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 25:2:25:33
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 7
    @loc: 38:19:38:21
    @status: to be proved

    @type: obligation
    @id: 7
    @loc: 38:19:38:21
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 8
    @loc: 38:22:38:26
    @status: to be proved

    @type: obligation
    @id: 8
    @loc: 38:22:38:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 9
    @loc: 38:28:38:32
    @status: to be proved

    @type: obligation
    @id: 9
    @loc: 38:28:38:32
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 10
    @loc: 29:9:29:26
    @status: to be proved

    @type: obligation
    @id: 10
    @loc: 29:9:29:26
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 11
    @loc: 29:9:29:26
    @status: to be proved

    @type: obligation
    @id: 11
    @loc: 29:9:29:26
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 12
    @loc: 33:26:33:28
    @status: to be proved

    @type: obligation
    @id: 12
    @loc: 33:26:33:28
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 13
    @loc: 33:29:33:33
    @status: to be proved

    @type: obligation
    @id: 13
    @loc: 33:29:33:33
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 14
    @loc: 32:36:32:38
    @status: to be proved

    @type: obligation
    @id: 14
    @loc: 32:36:32:38
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 15
    @loc: 32:39:32:43
    @status: to be proved

    @type: obligation
    @id: 15
    @loc: 32:39:32:43
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 16
    @loc: 37:26:37:28
    @status: to be proved

    @type: obligation
    @id: 16
    @loc: 37:26:37:28
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 17
    @loc: 37:29:37:33
    @status: to be proved

    @type: obligation
    @id: 17
    @loc: 37:29:37:33
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 18
    @loc: 36:33:36:35
    @status: to be proved

    @type: obligation
    @id: 18
    @loc: 36:33:36:35
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 19
    @loc: 36:36:36:40
    @status: to be proved

    @type: obligation
    @id: 19
    @loc: 36:36:36:40
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 20
    @loc: 39:2:39:29
    @status: to be proved

    @type: obligation
    @id: 20
    @loc: 39:2:39:29
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 21
    @loc: 39:2:39:29
    @status: to be proved

    @type: obligation
    @id: 21
    @loc: 39:2:39:29
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 22
    @loc: 39:2:39:29
    @status: to be proved

    @type: obligation
    @id: 22
    @loc: 39:2:39:29
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 23
    @loc: 39:15:39:29
    @status: to be proved

    @type: obligation
    @id: 23
    @loc: 39:15:39:29
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 24
    @loc: 39:15:39:29
    @status: to be proved

    @type: obligation
    @id: 24
    @loc: 39:15:39:29
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligationsnumber
    @count: 24

    File "./Cantor4.tla", line 15, character 1 to line 41, character 47:
    [INFO]: All 24 obligations proved.
---*)
