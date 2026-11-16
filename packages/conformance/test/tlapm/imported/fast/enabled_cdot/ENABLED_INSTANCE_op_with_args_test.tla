(*---
description: tlapm's own test fast/enabled_cdot/ENABLED_INSTANCE_op_with_args_test.tla.
ref: test/fast/enabled_cdot/ENABLED_INSTANCE_op_with_args_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE ENABLED_INSTANCE_op_with_args_test ----
EXTENDS TLAPS

---- MODULE Inner ----
VARIABLE x, y

A(z) == ENABLED (x' # y')

======================

VARIABLE x

M == INSTANCE Inner WITH y <- x

THEOREM M!A(x)
BY ExpandENABLED DEF M!A

===================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 24:1:24:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 24:1:24:3
    @status: proved
    @prover: isabelle
    @meth: auto; time-limit: 30
    @already: false

    @type: obligation
    @id: 2
    @loc: 24:4:24:17
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 24:4:24:17
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    @type: obligationsnumber
    @count: 0

    Zenon error: exhausted search space without finding a proof
    File "./ENABLED_INSTANCE_op_with_args_test.tla", line 9, character 1 to line 26, character 51:
    [INFO]: All 2 obligations proved.
    File "./ENABLED_INSTANCE_op_with_args_test.tla", line 12, character 1 to line 17, character 22:
    [INFO]: All 0 obligation proved.
---*)
