(*---
description: tlapm's own test bugs/sndord_test.tla, which checks stderr status:failed.
ref: test/bugs/sndord_test.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
---- MODULE sndord_test ----

EXTENDS TLAPS

(** Usable theorems quantify on fst-order operators.  This may become a problem
    for encodings into a fst-order logic like SMT-LIB.  This test reveals a
    flaw in the current SMT encoding that relies on the treatment of fst-order
    and snd-order operators.
*)

G(F(_), x) == F(x)

THEOREM Thm ==
        ASSUME NEW F(_),
               NEW a
        PROVE G(F, a) = F(a)
    (*BY DEF G*)

THEOREM Cor ==
        ASSUME NEW F1(_),
               NEW F2(_),
               NEW a
        PROVE G(F1, a) = G(F2, a)
    BY Thm

Z(x) == 0
S(x) == 1

THEOREM 0 = 1
<1>1 G(Z, 0) = 0    (*BY DEF G, Z*)
<1>2 G(S, 0) = 1    (*BY DEF G, S*)
<1> QED             (*BY ONLY Cor, <1>1, <1>2*)

====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 2
    @loc: 32:5:32:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 32:5:32:7
    @status: failed
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW CONSTANT F1(_),
           NEW CONSTANT F2(_),
           NEW CONSTANT a,
           ASSUME NEW CONSTANT F(_),
                  NEW CONSTANT a_1
           PROVE  G(F, a_1) = F(a_1) 
    PROVE  G(F1, a) = G(F2, a)

    @type: obligation
    @id: 3
    @loc: 32:8:32:11
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 32:8:32:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    Zenon error: exhausted search space without finding a proof
    Missing proof at File "./sndord_test.tla", line 24, character 29
    Missing proof at File "./sndord_test.tla", line 38, characters 1-16
    Missing proof at File "./sndord_test.tla", line 39, characters 1-16
    Missing proof at File "./sndord_test.tla", line 40, characters 1-7
    File "./sndord_test.tla", line 9, character 1 to line 42, character 4:
    [ERROR]: Proof incomplete in module "sndord_test": 4 missing, 0 omitted proof step(s).
    File "./sndord_test.tla", line 32, characters 5-6:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT F1(_),
                      NEW CONSTANT F2(_),
                      NEW CONSTANT a,
                      Thm 
               PROVE  G(F1, a) = G(F2, a)
    File "./sndord_test.tla", line 9, character 1 to line 42, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"sndord_test"`.
---*)
