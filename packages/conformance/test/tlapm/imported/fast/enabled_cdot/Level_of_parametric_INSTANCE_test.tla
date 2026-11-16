(*---
description: tlapm's own test fast/enabled_cdot/Level_of_parametric_INSTANCE_test.tla, which checks nostderr ending abnormally.
ref: test/fast/enabled_cdot/Level_of_parametric_INSTANCE_test.tla
features:
  - tlapm-test
mode: proof
outcome: incomplete
---*)
---- MODULE Level_of_parametric_INSTANCE_test ----
(* Test if the level weights of operators are
updated in case they have been computed before
parametric instantiation.

No fingerprints are used in this test to ensure
that the level computation is performed.
*)

---- MODULE Inner ----
VARIABLE x

Foo == x
======================

(* This horizontal line tests that the test script
`test/TOOLS/do_one_test` correctly reasons about
nesting of submodules.
*)
--------------------------------------------------

M(x) == INSTANCE Inner

THEOREM TRUE
<1>1. M!Foo(TRUE) => M!Foo(TRUE)
    OBVIOUS
<1> QED

==================================================

(*--- recorded
all:
  exit: 11
  transcript: |-
    @type: obligation
    @id: 2
    @loc: 34:5:34:12
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 34:5:34:12
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 0

    @type: obligationsnumber
    @count: 1

    File "./Level_of_parametric_INSTANCE_test.tla", line 18, character 1 to line 22, character 22:
    [INFO]: All 0 obligation proved.
    Missing proof at File "./Level_of_parametric_INSTANCE_test.tla", line 35, characters 1-7
    File "./Level_of_parametric_INSTANCE_test.tla", line 9, character 1 to line 37, character 50:
    [ERROR]: Proof incomplete in module "Level_of_parametric_INSTANCE_test": 1 missing, 0 omitted proof step(s).
    File "./Level_of_parametric_INSTANCE_test.tla", line 9, character 1 to line 37, character 50:
    [INFO]: All 1 obligation proved.
---*)
