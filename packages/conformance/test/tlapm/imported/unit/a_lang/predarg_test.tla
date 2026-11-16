(*---
description: tlapm's own test unit/a_lang/predarg_test.tla.
ref: test/unit/a_lang/predarg_test.tla
features:
  - tlapm-test
mode: proof
outcome: incomplete
---*)
---- MODULE predarg_test ----

(* NOTE: Requires higher-order unification *)

EXTENDS TLAPS

F(P(_), x) == P(x)

THEOREM DefF ==
        ASSUME NEW P(_),
               NEW x,
               P(x)
        PROVE F(P, x)
    (*BY DEF F*)

THEOREM ASSUME NEW x
        PROVE F(LAMBDA y : y = y, x)
    BY DefF

====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 2
    @loc: 26:5:26:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 26:5:26:7
    @status: proved
    @prover: isabelle
    @meth: auto; time-limit: 30
    @already: false

    @type: obligation
    @id: 3
    @loc: 26:8:26:12
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 26:8:26:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    Zenon error: exhausted search space without finding a proof
    Missing proof at File "./predarg_test.tla", line 21, character 22
    File "./predarg_test.tla", line 9, character 1 to line 28, character 4:
    [ERROR]: Proof incomplete in module "predarg_test": 1 missing, 0 omitted proof step(s).
    File "./predarg_test.tla", line 9, character 1 to line 28, character 4:
    [INFO]: All 2 obligations proved.
---*)
