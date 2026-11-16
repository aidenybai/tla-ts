(*---
description: tlapm's soundness test issue71_quantifier_bound_level_stest.tla states a false theorem, so an obligation must fail.
ref: test/soundness_tests/issue71_quantifier_bound_level_stest.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
------------- MODULE issue71_quantifier_bound_level_stest --------------

\* https://github.com/tlaplus/tlapm/issues/71
\* The level of \E x \in t : x = x ignores the variable t in the bound,
\* so X is taken to be constant and X' is identified with X.  The theorem
\* is false: it fails for a step from t = {} to t = {1}.

EXTENDS TLAPS

VARIABLE t

X == \E x \in t : x = x

THEOREM X = X'
BY Isa

=======================================================================

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 23:1:23:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 23:1:23:3
    @status: failed
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW VARIABLE t,
           TRUE 
    PROVE  X = X'

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

    File "./issue71_quantifier_bound_level_stest.tla", line 23, characters 1-2:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE t,
                      Isa 
               PROVE  X = X'
    File "./issue71_quantifier_bound_level_stest.tla", line 9, character 1 to line 25, character 71:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"issue71_quantifier_bound_level_stest"`.
---*)
