(*---
description: tlapm's own test fast/language/EXTENDS_in_submodule_test.tla.
ref: test/fast/language/EXTENDS_in_submodule_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE EXTENDS_in_submodule_test ----
(* Ensure that modules listed in EXTENDS statements
that are contained in submodules are loaded by `tlapm`.
*)


---- MODULE Inner ----
EXTENDS TLAPS

======================

==========================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligationsnumber
    @count: 0

    @type: obligationsnumber
    @count: 0

    File "./EXTENDS_in_submodule_test.tla", line 9, character 1 to line 20, character 42:
    [INFO]: All 0 obligation proved.
    File "./EXTENDS_in_submodule_test.tla", line 15, character 1 to line 18, character 22:
    [INFO]: All 0 obligation proved.
---*)
