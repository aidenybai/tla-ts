(*---
description: 'tlapm''s soundness test issue310_bound_var_capture_arity_stest.tla states a false theorem, and tlapm still proves it: https://github.com/tlaplus/tlapm/issues/310.'
ref: test/soundness_tests/issue310_bound_var_capture_arity_stest.tla
features:
  - tlapm-test
  - tlapm-bug
mode: proof
outcome: proved
---*)
------------- MODULE issue310_bound_var_capture_arity_stest --------------

\* https://github.com/tlaplus/tlapm/issues/310
\* Variant of issue310_bound_var_capture_stest in which both abstracted
\* terms mention the constant k, so they keep the same arity even once
\* abstractions take their free variables as arguments (#309).  For the
\* constant k, P(k, k) expands to \E k : w = <<k, k>>, which prints like
\* Q(k).  The theorem is false: with k = 2 and w = <<1, 2>> forever,
\* [](Q(k)) holds and [](P(k, k)) does not.

VARIABLE w

P(z, u) == \E k : w = <<z, u>>
Q(u)    == \E k : w = <<k, u>>

THEOREM ASSUME NEW k PROVE [](Q(k)) => [](P(k, k))
BY DEF P, Q

==========================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 26:1:26:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 26:1:26:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./issue310_bound_var_capture_arity_stest.tla", line 10, character 1 to line 28, character 74:
    [INFO]: All 1 obligation proved.
---*)
