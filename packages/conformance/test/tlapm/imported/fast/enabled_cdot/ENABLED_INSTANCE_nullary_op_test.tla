(*---
description: tlapm's own test fast/enabled_cdot/ENABLED_INSTANCE_nullary_op_test.tla.
ref: test/fast/enabled_cdot/ENABLED_INSTANCE_nullary_op_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE ENABLED_INSTANCE_nullary_op_test ----
EXTENDS TLAPS

---- MODULE Inner ----
VARIABLE x

A == ENABLED (x')

======================

VARIABLE x

M == INSTANCE Inner

THEOREM M!A
BY ExpandENABLED DEF M!A

=================================================

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
    @prover: smt
    @meth: time-limit: 5
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

    File "./ENABLED_INSTANCE_nullary_op_test.tla", line 9, character 1 to line 26, character 49:
    [INFO]: All 2 obligations proved.
    File "./ENABLED_INSTANCE_nullary_op_test.tla", line 12, character 1 to line 17, character 22:
    [INFO]: All 0 obligation proved.
---*)
