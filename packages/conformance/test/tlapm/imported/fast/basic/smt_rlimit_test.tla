(*---
description: tlapm's own test fast/basic/smt_rlimit_test.tla.
ref: test/fast/basic/smt_rlimit_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE smt_rlimit_test ----

(* Regression test for https://github.com/tlaplus/tlapm/issues/281

   `SMTT`/`Z3T` accept a string budget of the form "rN" that bounds the
   underlying Z3 solver by a deterministic `rlimit` budget (a multiple of a
   fixed base resource count) instead of a wall-clock timeout. A generous
   budget must discharge these obligations just like the ordinary
   numeric-timeout form.
*)

EXTENDS TLAPS, Naturals

THEOREM t1 == 2 + 2 = 4 BY SMTT("r10")

THEOREM t2 == 2 * 3 = 6 BY Z3T("r10")

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 22:25:22:27
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 22:25:22:27
    @status: proved
    @prover: smt
    @meth: time-limit: inf
    @already: false

    @type: obligation
    @id: 2
    @loc: 22:28:22:39
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 22:28:22:39
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 24:25:24:27
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 24:25:24:27
    @status: proved
    @prover: z3
    @meth: time-limit: inf
    @already: false

    @type: obligation
    @id: 4
    @loc: 24:28:24:38
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 24:28:24:38
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 4

    File "./smt_rlimit_test.tla", line 9, character 1 to line 26, character 4:
    [INFO]: All 4 obligations proved.
---*)
