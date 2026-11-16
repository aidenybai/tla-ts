(*---
description: tlapm's own test bugs/sndord_bis_test.tla, which checks stderr status:failed.
ref: test/bugs/sndord_bis_test.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
---- MODULE sndord_bis_test ----

EXTENDS TLAPS

(** A simpler variant of sndord_test *)

C == {}

G(F(_)) == F(C)

THEOREM Thm ==
        ASSUME NEW F(_)
        PROVE G(F) = F(C)
    (*BY DEF G*)

THEOREM Cor ==
        ASSUME NEW F1(_),
               NEW F2(_)
        PROVE G(F1) = G(F2)
    BY Thm

Z(x) == 0
S(x) == 1

THEOREM 0 = 1
<1>1 G(Z) = 0   (*BY DEF G, Z*)
<1>2 G(S) = 1   (*BY DEF G, S*)
<1> QED         (*BY ONLY Cor, <1>1, <1>2*)

====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 2
    @loc: 28:5:28:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 28:5:28:7
    @status: failed
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW CONSTANT F1(_),
           NEW CONSTANT F2(_),
           ASSUME NEW CONSTANT F(_)
           PROVE  G(F) = F(C) 
    PROVE  G(F1) = G(F2)

    @type: obligation
    @id: 3
    @loc: 28:8:28:11
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 28:8:28:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    Zenon error: exhausted search space without finding a proof
    Missing proof at File "./sndord_bis_test.tla", line 21, character 26
    Missing proof at File "./sndord_bis_test.tla", line 34, characters 1-13
    Missing proof at File "./sndord_bis_test.tla", line 35, characters 1-13
    Missing proof at File "./sndord_bis_test.tla", line 36, characters 1-7
    File "./sndord_bis_test.tla", line 9, character 1 to line 38, character 4:
    [ERROR]: Proof incomplete in module "sndord_bis_test": 4 missing, 0 omitted proof step(s).
    File "./sndord_bis_test.tla", line 28, characters 5-6:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT F1(_),
                      NEW CONSTANT F2(_),
                      Thm 
               PROVE  G(F1) = G(F2)
    File "./sndord_bis_test.tla", line 9, character 1 to line 38, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"sndord_bis_test"`.
---*)
