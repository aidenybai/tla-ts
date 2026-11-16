(*---
description: tlapm's soundness test issue235_set_enum_membership_stest.tla states a false theorem, so an obligation must fail.
ref: test/soundness_tests/issue235_set_enum_membership_stest.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
------------- MODULE issue235_set_enum_membership_stest --------------

\* https://github.com/tlaplus/tlapm/issues/235
\* {e \in S} is the enumeration of the single Boolean e \in S, so it is
\* not empty.  The tlapm parser drops elements of the form e \in S from
\* set enumerations and reads it as {}.  The theorem is false.

CONSTANTS e, S

THEOREM {e \in S} = {}
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
    ASSUME NEW CONSTANT e,
           NEW CONSTANT S
    PROVE  {e \in S} = {}

    @type: obligationsnumber
    @count: 1

    Zenon error: exhausted search space without finding a proof
    File "./issue235_set_enum_membership_stest.tla", line 19, characters 1-7:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT e,
                      NEW CONSTANT S
               PROVE  {e \in S} = {}
    File "./issue235_set_enum_membership_stest.tla", line 9, character 1 to line 21, character 69:
    [ERROR]: 1/1 obligation failed.
    There were backend errors processing module `"issue235_set_enum_membership_stest"`.
---*)
