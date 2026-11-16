(*---
description: tlapm's soundness test issue139_negated_boolean_eq_stest.tla states a false theorem, so an obligation must fail.
ref: test/soundness_tests/issue139_negated_boolean_eq_stest.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
------------- MODULE issue139_negated_boolean_eq_stest --------------

\* https://github.com/tlaplus/tlapm/issues/139
\* x is not known to be a Boolean, so ~(x = TRUE) does not imply
\* x = FALSE.  The theorem is false for any x that is not a Boolean.
\* The old SMT encoding in release 1.5.0 and earlier proves it.

VARIABLE x

THEOREM ~(x = TRUE) <=> (x = FALSE)
OBVIOUS

=====================================================================

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 19:1:19:8
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 19:1:19:8
    @status: failed
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW VARIABLE x
    PROVE  ~x = TRUE <=> x = FALSE

    @type: obligationsnumber
    @count: 1

    Zenon error: exhausted search space without finding a proof
    File "./issue139_negated_boolean_eq_stest.tla", line 19, characters 1-7:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x
               PROVE  ~x = TRUE <=> x = FALSE
    File "./issue139_negated_boolean_eq_stest.tla", line 9, character 1 to line 21, character 69:
    [ERROR]: 1/1 obligation failed.
    There were backend errors processing module `"issue139_negated_boolean_eq_stest"`.
---*)
