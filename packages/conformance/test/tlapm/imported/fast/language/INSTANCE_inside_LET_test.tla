(*---
description: tlapm's own test fast/language/INSTANCE_inside_LET_test.tla.
ref: test/fast/language/INSTANCE_inside_LET_test.tla
features:
  - tlapm-test
mode: proof
outcome: incomplete
---*)
---- MODULE INSTANCE_inside_LET_test ----
(* Module.Elab` replaces each `INSTANCE` statement
with definitions. If the instantiated module
extends the module `TLAPS`, then the definitions
include backend pragmas (constructor `Bpragma`).

If the `INSTANCE` definition appears inside a `LET`,
then normalization of `LET` and fingerprints need
to handle `Bpragma` as a case.
*)


---- MODULE Inner ----
EXTENDS TLAPS

A == TRUE
======================


THEOREM
    LET M == INSTANCE Inner
    IN M!A


THEOREM TRUE
OBVIOUS  (* used to raise assertion failure at `Expr.Elab.let_normalize` *)

=========================================

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 2
    @loc: 34:1:34:8
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 34:1:34:8
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    @type: obligationsnumber
    @count: 0

    Missing proof at File "./INSTANCE_inside_LET_test.tla", line 30, character 11
    File "./INSTANCE_inside_LET_test.tla", line 9, character 1 to line 36, character 41:
    [ERROR]: Proof incomplete in module "INSTANCE_inside_LET_test": 1 missing, 0 omitted proof step(s).
    File "./INSTANCE_inside_LET_test.tla", line 9, character 1 to line 36, character 41:
    [INFO]: All 1 obligation proved.
    File "./INSTANCE_inside_LET_test.tla", line 21, character 1 to line 25, character 22:
    [INFO]: All 0 obligation proved.
---*)
