(*---
description: tlapm's soundness test variable_capture_stest.tla states a false theorem, so an obligation must fail.
ref: test/soundness_tests/variable_capture_stest.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
-------------- MODULE variable_capture_stest ---------------
EXTENDS Integers, TLAPS

VARIABLE x, x_prime
CONSTANT 0m, x0m
CONSTANT _ && _, a__andand(_,_)

---- MODULE bar ----
andand(a, b) == 3
====
a == INSTANCE bar

THEOREM bug ==
  \/ x_prime = x'
  \/ 0m = x0m
  \/ a__andand (2, 1) = 2 && 1
  \/ a!andand(1,2) = 1 && 2
BY SMT

===========================================

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 26:1:26:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 26:1:26:3
    @status: failed
    @prover: smt
    @meth: time-limit: 5
    @reason: timeout
    @already: false
    @obl: 
    ASSUME NEW VARIABLE x,
           NEW VARIABLE x_prime,
           NEW CONSTANT 0m,
           NEW CONSTANT x0m,
           NEW CONSTANT &&(_, _),
           NEW CONSTANT a__andand(_, _),
           TRUE 
    PROVE  \/ x_prime = x'
           \/ 0m = x0m
           \/ a__andand(2, 1) = 2 && 1
           \/ a!andand(1, 2) = 1 && 2

    @type: obligation
    @id: 2
    @loc: 26:4:26:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 26:4:26:7
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 0

    @type: obligationsnumber
    @count: 2

    File "./variable_capture_stest.tla", line 16, character 1 to line 18, character 4:
    [INFO]: All 0 obligation proved.
    File "./variable_capture_stest.tla", line 26, characters 1-2:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      NEW VARIABLE x_prime,
                      NEW CONSTANT 0m,
                      NEW CONSTANT x0m,
                      NEW CONSTANT &&(_, _),
                      NEW CONSTANT a__andand
                      (_, _),
                      SMT 
               PROVE  \/ x_prime = x'
                      \/ 0m = x0m
                      \/ a__andand(2, 1) = 2 && 1
                      \/ a!andand(1, 2) = 1 && 2
    File "./variable_capture_stest.tla", line 9, character 1 to line 28, character 43:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"variable_capture_stest"`.
---*)
