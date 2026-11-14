(*---
description: tlapm's own test bugs/strict_empty_target_test.tla, which checks stderr No proof obligation found for the selected target.
ref: test/bugs/strict_empty_target_test.tla
features:
  - tlapm-test
mode: proof
outcome: empty-target
args:
  - '--line'
  - '1'
---*)
---- MODULE strict_empty_target_test ----

(* Regression test for https://github.com/tlaplus/tlapm/issues/276

   An explicit target (`--line`) that selects no proof obligation otherwise
   reports "All 0 obligation proved" and exits 0, making an off-by-one line
   number look like a successful proof. Line 1 is the module header and selects
   no obligation. With `--strict` this is reported and tlapm exits with code 12
   (empty proof target).
*)

THEOREM TRUE OBVIOUS

====

(*--- recorded
all:
  exit: 12
  transcript: |-
    @type: obligationsnumber
    @count: 0

    File "./strict_empty_target_test.tla", line 12, character 1 to line 25, character 4:
    [ERROR]: No proof obligation found for the selected target.
    File "./strict_empty_target_test.tla", line 12, character 1 to line 25, character 4:
    [INFO]: All 0 obligation proved.
---*)
