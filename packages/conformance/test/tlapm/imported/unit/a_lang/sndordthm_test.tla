(*---
description: tlapm's own test unit/a_lang/sndordthm_test.tla.
ref: test/unit/a_lang/sndordthm_test.tla
features:
  - tlapm-test
mode: proof
outcome: incomplete
---*)
---- MODULE sndordthm_test ----

(* NOTE: Requires higher-order unification *)

EXTENDS TLAPS

THEOREM Thm ==
        ASSUME NEW F(_),
               NEW a
        PROVE F(a)

THEOREM ASSUME NEW F(_),
               NEW a
        PROVE F(a)
    BY Thm

====

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 2
    @loc: 23:5:23:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 23:5:23:7
    @status: proved
    @prover: isabelle
    @meth: auto; time-limit: 30
    @already: false

    @type: obligation
    @id: 3
    @loc: 23:8:23:11
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 23:8:23:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    Zenon error: exhausted search space without finding a proof
    Missing proof at File "./sndordthm_test.tla", line 18, character 19
    File "./sndordthm_test.tla", line 9, character 1 to line 25, character 4:
    [ERROR]: Proof incomplete in module "sndordthm_test": 1 missing, 0 omitted proof step(s).
    File "./sndordthm_test.tla", line 9, character 1 to line 25, character 4:
    [INFO]: All 2 obligations proved.
---*)
