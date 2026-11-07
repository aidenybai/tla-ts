(*---
description: Zenon's regression test zenon/regression/peterson/MutexQ.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/peterson/MutexQ.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
-------------------------------- MODULE MutexQ ------------------------------ 

CONSTANTS x, y, pcx, pcy, xp, yp, pcxp, pcyp, q0, q1, q2

ASSUME Arith == /\ q1 # q0 
                /\ q2 # q1
                /\ q2 # q0

Init == /\ x = FALSE
        /\ y = FALSE
        /\ pcx = q0
        /\ pcy = q0

Next == \/ /\ pcx = q0
           /\ pcxp = q1
           /\ xp = TRUE
           /\ yp = y
           /\ pcyp = pcy
        \/ /\ pcy = q0
           /\ pcyp = q1
           /\ yp = TRUE
           /\ xp = x
           /\ pcxp = pcx
        \/ /\ pcx = q1
           /\ y = FALSE
           /\ pcxp = q2
           /\ xp = x
           /\ yp = y
           /\ pcyp = pcy
        \/ /\ pcy = q1
           /\ x = FALSE
           /\ pcyp = q2
           /\ yp = y
           /\ xp = x
           /\ pcxp = pcx
        \/ /\ xp = x
           /\ yp = y
           /\ pcxp = pcx
           /\ pcyp = pcy
    

Inv == /\ x \in BOOLEAN
       /\ y \in BOOLEAN
       /\ pcx \in {q0, q1, q2}
       /\ pcy \in {q0, q1, q2}
       /\ \/ pcx = q1
          \/ pcx = q2
          => x = TRUE
       /\ \/ pcy = q1
          \/ pcy = q2
          => y = TRUE
       /\ ~ (pcx = q2 /\ pcy = q2)

Invp == 
       /\ xp \in BOOLEAN
       /\ yp \in BOOLEAN
       /\ pcxp \in {q0, q1, q2}
       /\ pcyp \in {q0, q1, q2}
       /\ \/ pcxp = q1
          \/ pcxp = q2
          => xp = TRUE
       /\ \/ pcyp = q1
          \/ pcyp = q2
          => yp = TRUE
       /\ ~ (pcxp = q2 /\ pcyp = q2)


THEOREM Inv /\ Next => Invp
PROOF 
<1>1. USE Arith
<1>2. QED
      BY Arith DEFS Inv, Next, Invp
=============================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 83:7:83:9
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 83:7:83:9
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 83:10:83:15
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 83:10:83:15
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 81:11:81:16
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 81:11:81:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 3

    File "./MutexQ.tla", line 12, character 1 to line 84, character 77:
    [INFO]: All 3 obligations proved.
---*)
