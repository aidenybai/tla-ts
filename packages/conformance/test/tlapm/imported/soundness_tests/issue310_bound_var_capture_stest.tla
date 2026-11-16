(*---
description: 'tlapm''s soundness test issue310_bound_var_capture_stest.tla states a false theorem, and tlapm still proves it: https://github.com/tlaplus/tlapm/issues/310.'
ref: test/soundness_tests/issue310_bound_var_capture_stest.tla
features:
  - tlapm-test
  - tlapm-bug
mode: proof
outcome: proved
---*)
------------- MODULE issue310_bound_var_capture_stest --------------

\* https://github.com/tlaplus/tlapm/issues/310
\* The print that names abstracted terms renders a bound variable exactly
\* like a constant of the same name.  For the constant k, P(k) expands to
\* \E k : w = k, which prints like Q, so [](P(k)) and []Q become the same
\* opaque constant.  The theorem is false: Q is valid, while [](P(k))
\* fails for any behavior in which w is never k.

VARIABLE w

P(z) == \E k : w = z
Q    == \E k : w = k

THEOREM ASSUME NEW k PROVE []Q => [](P(k))
BY DEF P, Q

====================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 25:1:25:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 25:1:25:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./issue310_bound_var_capture_stest.tla", line 10, character 1 to line 27, character 68:
    [INFO]: All 1 obligation proved.
---*)
