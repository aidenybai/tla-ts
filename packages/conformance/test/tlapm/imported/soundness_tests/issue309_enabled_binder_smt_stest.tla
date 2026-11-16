(*---
description: 'tlapm''s soundness test issue309_enabled_binder_smt_stest.tla states a false theorem, and tlapm still proves it: https://github.com/tlaplus/tlapm/issues/309.'
ref: test/soundness_tests/issue309_enabled_binder_smt_stest.tla
features:
  - tlapm-test
  - tlapm-bug
mode: proof
outcome: proved
---*)
------------- MODULE issue309_enabled_binder_smt_stest --------------

\* https://github.com/tlaplus/tlapm/issues/309
\* An ENABLED under a binder is abstracted as a nullary constant, so the
\* bound variable t is dropped and (\E t : c) => (\A t : c) is proved.
\* The theorem is false: ENABLED (x = t /\ x' = t) is equivalent to
\* x = t, which holds for some t but not for all t.

EXTENDS TLAPS

VARIABLE x

THEOREM (\E t : ENABLED (x = t /\ x' = t)) => (\A t : ENABLED (x = t /\ x' = t))
BY SMT

=====================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 23:1:23:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 23:1:23:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 23:4:23:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 23:4:23:7
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./issue309_enabled_binder_smt_stest.tla", line 10, character 1 to line 25, character 69:
    [INFO]: All 2 obligations proved.
---*)
