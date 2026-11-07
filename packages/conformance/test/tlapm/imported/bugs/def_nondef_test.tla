(*---
description: tlapm's own test bugs/def_nondef_test.tla, which checks stderr "C" is not a definition and cannot be used in a DEF clause; stderr "v" is not a definition and cannot be used in a DEF clause; stderr "xx" is not a definition and cannot be used in a DEF clause; nostderr set_defn; nostderr bug in TLAPM; nostderr ending abnormally.
ref: test/bugs/def_nondef_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE def_nondef_test ----

(* Regression test for https://github.com/tlaplus/tlapm/issues/280

   A DEF clause (`BY ... DEF X`, `USE DEF X`, or `HIDE DEF X`) that cites a
   name which is in scope but is not a definition -- a CONSTANT, a VARIABLE, or
   a NEW-declared constant/operator -- used to crash the whole run with
   `Failure("Proof.Gen.set_defn/doit")` ("Oops, this seems to be a bug in
   TLAPM"). It must instead be reported as a normal located error and the run
   must not abort abnormally.
*)

CONSTANT C
VARIABLE v

THEOREM TRUE BY DEF C

THEOREM TRUE
  <1>1. USE DEF v
  <1>2. QED OBVIOUS

THEOREM ASSUME NEW xx PROVE TRUE
  BY DEF xx

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 24:14:24:16
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 24:14:24:16
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 28:13:28:20
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 28:13:28:20
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: obligation
    @id: 3
    @loc: 31:3:31:5
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 31:3:31:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: true

    @type: warning
    @msg: File "./def_nondef_test.tla", line 24, character 21 :
    "C" is not a definition and cannot be used in a DEF clause.

    @type: warning
    @msg: File "./def_nondef_test.tla", line 27, character 17 :
    "v" is not a definition and cannot be used in a DEF clause.

    @type: warning
    @msg: File "./def_nondef_test.tla", line 31, characters 10-11 :
    "xx" is not a definition and cannot be used in a DEF clause.

    @type: obligationsnumber
    @count: 3

    File "./def_nondef_test.tla", line 9, character 1 to line 33, character 4:
    [INFO]: All 3 obligations proved.
---*)
