(*---
description: tlapm's own test fast/regression/smt_domain_check_test.tla.
ref: test/fast/regression/smt_domain_check_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
---- MODULE smt_domain_check_test ----
EXTENDS Naturals, Integers, TLAPS
LEMMA
 ASSUME NEW N \in Nat,
        NEW f \in [0 .. N-1 -> Int]
 PROVE  \A i \in Nat : (IF i < N THEN f[i] ELSE 42) \in Int
BY SMT
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 15:1:15:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 15:1:15:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 15:4:15:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 15:4:15:7
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./smt_domain_check_test.tla", line 9, character 1 to line 16, character 4:
    [INFO]: All 2 obligations proved.
---*)
