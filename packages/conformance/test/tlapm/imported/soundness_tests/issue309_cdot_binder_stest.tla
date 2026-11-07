(*---
description: 'tlapm''s soundness test issue309_cdot_binder_stest.tla states a false theorem, and tlapm still proves it: https://github.com/tlaplus/tlapm/issues/309.'
ref: test/soundness_tests/issue309_cdot_binder_stest.tla
features:
  - tlapm-test
  - tlapm-bug
mode: proof
outcome: proved
---*)
------------- MODULE issue309_cdot_binder_stest --------------

\* https://github.com/tlaplus/tlapm/issues/309
\* Same defect as issue309_enabled_binder_smt_stest, with \cdot under the
\* binder instead of ENABLED.  The theorem is false:
\* (x = t) \cdot (x' = t) is equivalent to x = t /\ x' = t, which holds
\* for some t but not for all t.

VARIABLE x

THEOREM (\E t : (x = t) \cdot (x' = t)) => (\A t : (x = t) \cdot (x' = t))
OBVIOUS

==============================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 21:1:21:8
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 21:1:21:8
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./issue309_cdot_binder_stest.tla", line 10, character 1 to line 23, character 62:
    [INFO]: All 1 obligation proved.
---*)
