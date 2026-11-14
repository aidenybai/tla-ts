(*---
description: tlapm's own test bugs/constantfcn_test.tla, which checks stderr status:failed.
ref: test/bugs/constantfcn_test.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
---- MODULE constantfcn_test ----

EXTENDS TLAPS

(* This is proved by SMT (Hernan Vanzetto's version) with `--debug types2`,
 * most likely because the domain condition is not checked in function
 * applications. *)

F == [ y \in { 1 } |-> 0 ]

THEOREM Thm1 ==
        F[0] = 0
    BY DEF F

(* Here is how this can be exploited to derive a contradiction.
 * It suffices to define functions F and G that are equal (same domain
 * and same values on that domain), but with expressions that do not
 * match for values outside their domain. *)

G == [ y \in { 1 } |-> IF y = 1 THEN 0 ELSE 1 ]

THEOREM Thm2 ==
        G[0] = 1
    (* Same method than Thm1 *)
    (*BY DEF G*)

THEOREM 0 = 1
<1>1 F = G    (*BY DEF F, G*)
<1>2 0 = F[0] (*BY Thm1*)
<1>3 @ = G[0] (*BY <1>1*)
<1>4 @ = 1    (*BY Thm2*)
<1> QED       (*BY ONLY <1>2, <1>3, <1>4*)

====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 21:5:21:7
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 21:5:21:7
    @status: failed
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: false
    @already: false
    @obl: 
    [y \in {1} |-> 0][0] = 0

    @type: obligationsnumber
    @count: 1

    Zenon error: exhausted search space without finding a proof
    Missing proof at File "./constantfcn_test.tla", line 31, character 17
    Missing proof at File "./constantfcn_test.tla", line 36, characters 1-10
    Missing proof at File "./constantfcn_test.tla", line 37, characters 1-13
    Missing proof at File "./constantfcn_test.tla", line 38, characters 1-13
    Missing proof at File "./constantfcn_test.tla", line 39, characters 1-10
    Missing proof at File "./constantfcn_test.tla", line 40, characters 1-7
    File "./constantfcn_test.tla", line 9, character 1 to line 42, character 4:
    [ERROR]: Proof incomplete in module "constantfcn_test": 6 missing, 0 omitted proof step(s).
    File "./constantfcn_test.tla", line 21, characters 5-6:
    [ERROR]: Could not prove or check:
               ASSUME F == [y \in {1} |-> 0]
               PROVE  F[0] = 0
    File "./constantfcn_test.tla", line 9, character 1 to line 42, character 4:
    [ERROR]: 1/1 obligation failed.
    There were backend errors processing module `"constantfcn_test"`.
---*)
