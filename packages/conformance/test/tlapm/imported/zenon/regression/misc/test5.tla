(*---
description: Zenon's regression test zenon/regression/misc/test5.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/misc/test5.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
   ------------------ MODULE test5 -----------------
   P(x) == x = x
   Q == 1=1

(*******************  the following is proved
   THEOREM (\E i : P(i)) => Q
   <1>1. ASSUME NEW i 
         PROVE P(i) => Q
   <1>2. QED
         BY <1>1
**********************)

(*******************  the following is proved
  THEOREM \E i \in {0,1} : P(i)
   <1>1. P(1)
   <1>2. QED
         BY <1>1
**********************)

THEOREM  (~ (\E i : P(i))) <=> (\A i : ~P(i)) 
OBVIOUS
==============
THEOREM  (~ (\E i \in {0, 1} : P(i))) <=> (\A i \in {0, 1} : ~P(i)) 
OBVIOUS
=================

(******
   THEOREM (\E i \in {0, 1} : P(i)) => Q
   <1>1. ASSUME NEW i \in {0,1}
         PROVE P(i) => Q
   <1>2. QED
         BY <1>1
**********)

   THEOREM (\E i \in {0, 1} : P(i)) => Q



   <1>1. SUFFICES (\A i \in {0, 1} : ~P(i)) \/ Q
     OBVIOUS

   <1>2. SUFFICES \A i \in {0, 1} : ~P(i) \/ Q
\*      OBVIOUS
   <1>3. SUFFICES \A i \in {0, 1} : P(i) => Q
\*      OBVIOUS
   <1>4. ASSUME NEW i \in {0,1} 
         PROVE  P(i) => Q
   <1>5. QED
\*      BY <1>4 

   ================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 32:1:32:8
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 32:1:32:8
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./test5.tla", line 12, character 4 to line 33, character 14:
    [INFO]: All 1 obligation proved.
---*)
