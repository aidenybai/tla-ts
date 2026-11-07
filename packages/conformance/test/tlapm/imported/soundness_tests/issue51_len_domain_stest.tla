(*---
description: tlapm's soundness test issue51_len_domain_stest.tla states a false theorem, so an obligation must fail.
ref: test/soundness_tests/issue51_len_domain_stest.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
------------- MODULE issue51_len_domain_stest --------------

\* https://github.com/tlaplus/tlapm/issues/51
\* Len(f) is a CHOOSE without a witness for a function f on Nat, so its
\* value is unspecified and may lie in Nat.  The assumptions are
\* consistent, and the theorem is false.

EXTENDS Naturals, Sequences, TLAPS

THEOREM ASSUME NEW f, DOMAIN f = Nat, Len(f) \in Nat
        PROVE  FALSE
BY SMT

============================================================

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
    @prover: smt
    @meth: time-limit: 5
    @reason: timeout
    @already: false
    @obl: 
    ASSUME NEW CONSTANT f,
           DOMAIN f = Nat ,
           Len(f) \in Nat ,
           TRUE 
    PROVE  FALSE

    @type: obligation
    @id: 2
    @loc: 20:4:20:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 20:4:20:7
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./issue51_len_domain_stest.tla", line 20, characters 1-2:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT f,
                      DOMAIN f = Nat ,
                      Len(f) \in Nat ,
                      SMT 
               PROVE  FALSE
    File "./issue51_len_domain_stest.tla", line 9, character 1 to line 22, character 60:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"issue51_len_domain_stest"`.
---*)
