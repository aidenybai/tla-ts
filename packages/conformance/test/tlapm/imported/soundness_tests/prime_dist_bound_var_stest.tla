(*---
description: tlapm's soundness test prime_dist_bound_var_stest.tla states a false theorem, so an obligation must fail.
ref: test/soundness_tests/prime_dist_bound_var_stest.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
------------- MODULE prime_dist_bound_var_stest --------------

VARIABLE Y

P(a,x) == IF Y THEN x ELSE x

THEOREM 1 = 2
<1>1. \A z : P(Y,z)' = z
  BY DEF P
<1>2. QED BY <1>1

===================

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 18:11:18:13
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 18:11:18:13
    @status: failed
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: timeout
    @already: false
    @obl: 
    ASSUME NEW VARIABLE Y,
           \A z : P(Y, z)' = z 
    PROVE  1 = 2

    @type: obligation
    @id: 2
    @loc: 18:14:18:18
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 18:14:18:18
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 17:3:17:5
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 17:3:17:5
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligationsnumber
    @count: 3

    Zenon error: exhausted search space without finding a proof
    File "./prime_dist_bound_var_stest.tla", line 18, characters 11-12:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE Y,
                      <1>1 
               PROVE  1 = 2
    File "./prime_dist_bound_var_stest.tla", line 9, character 1 to line 20, character 19:
    [ERROR]: 1/3 obligations failed.
    There were backend errors processing module `"prime_dist_bound_var_stest"`.
---*)
