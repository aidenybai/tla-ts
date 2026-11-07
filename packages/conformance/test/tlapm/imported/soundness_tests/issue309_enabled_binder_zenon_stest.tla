(*---
description: 'tlapm''s soundness test issue309_enabled_binder_zenon_stest.tla states a false theorem, and tlapm still proves it: https://github.com/tlaplus/tlapm/issues/309.'
ref: test/soundness_tests/issue309_enabled_binder_zenon_stest.tla
features:
  - tlapm-test
  - tlapm-bug
mode: proof
outcome: proved
---*)
------------- MODULE issue309_enabled_binder_zenon_stest --------------

\* https://github.com/tlaplus/tlapm/issues/309
\* Zenon variant of issue309_enabled_binder_smt_stest.

EXTENDS TLAPS

VARIABLE x

THEOREM (\E t : ENABLED (x = t /\ x' = t)) => (\A t : ENABLED (x = t /\ x' = t))
BY Zenon

=======================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 20:1:20:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 20:1:20:3
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 20:4:20:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 20:4:20:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./issue309_enabled_binder_zenon_stest.tla", line 10, character 1 to line 22, character 71:
    [INFO]: All 2 obligations proved.
---*)
