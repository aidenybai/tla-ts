(*---
description: tlapm's soundness test issue188_isfiniteset_level_stest.tla states a false theorem, so an obligation must fail.
ref: test/soundness_tests/issue188_isfiniteset_level_stest.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
------------- MODULE issue188_isfiniteset_level_stest --------------

\* https://github.com/tlaplus/tlapm/issues/188
\* Inv is a state predicate, but a wrong level for IsFiniteSet made it
\* constant, so Inv' was identified with Inv.  The theorem is false: it
\* fails for a step from v = {} to v = Nat.

EXTENDS FiniteSets

VARIABLE v

Inv == IsFiniteSet(v)

THEOREM ASSUME Inv PROVE Inv'
OBVIOUS

====================================================================

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 23:1:23:8
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 23:1:23:8
    @status: failed
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW VARIABLE v,
           Inv 
    PROVE  Inv'

    @type: obligationsnumber
    @count: 1

    Zenon error: exhausted search space without finding a proof
    File "./issue188_isfiniteset_level_stest.tla", line 23, characters 1-7:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE v,
                      Inv 
               PROVE  Inv'
    File "./issue188_isfiniteset_level_stest.tla", line 9, character 1 to line 25, character 68:
    [ERROR]: 1/1 obligation failed.
    There were backend errors processing module `"issue188_isfiniteset_level_stest"`.
---*)
