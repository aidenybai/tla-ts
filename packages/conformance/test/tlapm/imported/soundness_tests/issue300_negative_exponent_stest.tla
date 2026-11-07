(*---
description: tlapm's soundness test issue300_negative_exponent_stest.tla states a false theorem, so an obligation must fail.
ref: test/soundness_tests/issue300_negative_exponent_stest.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
------------- MODULE issue300_negative_exponent_stest --------------

\* https://github.com/tlaplus/tlapm/issues/300
\* For a non-zero integer n, n ^ (-1) is the real number 1/n (Specifying
\* Systems, Fig. 18.5b), which is not an integer for, e.g., n = 2.  The
\* theorem is false.

EXTENDS Integers, TLAPS

THEOREM ASSUME NEW n \in Int, n # 0
        PROVE  n ^ (-1) \in Int
BY Z3

====================================================================

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 20:1:20:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 20:1:20:3
    @status: failed
    @prover: z3
    @meth: time-limit: 5
    @reason: timeout
    @already: false
    @obl: 
    ASSUME NEW CONSTANT n \in Int,
           n # 0 ,
           TRUE 
    PROVE  n ^ (-1) \in Int

    @type: obligation
    @id: 2
    @loc: 20:4:20:6
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 20:4:20:6
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./issue300_negative_exponent_stest.tla", line 20, characters 1-2:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT n \in Int,
                      n # 0 ,
                      Z3 
               PROVE  n ^ (-1) \in Int
    File "./issue300_negative_exponent_stest.tla", line 9, character 1 to line 22, character 68:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"issue300_negative_exponent_stest"`.
---*)
