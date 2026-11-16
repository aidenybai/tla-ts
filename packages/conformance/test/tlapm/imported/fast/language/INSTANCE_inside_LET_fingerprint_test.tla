(*---
description: tlapm's own test fast/language/INSTANCE_inside_LET_fingerprint_test.tla.
ref: test/fast/language/INSTANCE_inside_LET_fingerprint_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE INSTANCE_inside_LET_fingerprint_test ----
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
OBVIOUS  (* used to raise an assertion failure at:
    `Backend.Fingerprints.fp_let: other` *)


=====================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 31:1:31:8
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 31:1:31:8
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    @type: obligationsnumber
    @count: 0

    File "./INSTANCE_inside_LET_fingerprint_test.tla", line 9, character 1 to line 35, character 53:
    [INFO]: All 1 obligation proved.
    File "./INSTANCE_inside_LET_fingerprint_test.tla", line 21, character 1 to line 25, character 22:
    [INFO]: All 0 obligation proved.
---*)
