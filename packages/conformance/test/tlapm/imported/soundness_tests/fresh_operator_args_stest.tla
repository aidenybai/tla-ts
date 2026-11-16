(*---
description: tlapm's soundness test fresh_operator_args_stest.tla states a false theorem, so an obligation must fail.
ref: test/soundness_tests/fresh_operator_args_stest.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
------------- MODULE fresh_operator_args_stest --------------

\* The action frontend must not abstract an application of a declared
\* STATE operator without its constant arguments: F(1) and F(2) would
\* become the same term.  The theorem is false: F may differ on 1 and 2.

THEOREM ASSUME NEW STATE F(_) PROVE F(1) = F(2)
OBVIOUS

============================================================

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 16:1:16:8
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 16:1:16:8
    @status: failed
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW STATE F(_)
    PROVE  F(1) = F(2)

    @type: obligationsnumber
    @count: 1

    Zenon error: exhausted search space without finding a proof
    File "./fresh_operator_args_stest.tla", line 16, characters 1-7:
    [ERROR]: Could not prove or check:
               ASSUME NEW STATE F(_)
               PROVE  F(1) = F(2)
    File "./fresh_operator_args_stest.tla", line 9, character 1 to line 18, character 60:
    [ERROR]: 1/1 obligation failed.
    There were backend errors processing module `"fresh_operator_args_stest"`.
---*)
