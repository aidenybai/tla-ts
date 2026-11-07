(*---
description: tlapm's soundness test new_bound_time_stest.tla states a false theorem, so an obligation must fail.
ref: test/soundness_tests/new_bound_time_stest.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
------------- MODULE new_bound_time_stest --------------

\* Before PTL, NEW c \in {x} becomes NEW c and the fact c \in {x}.  The
\* time of this fact must be computed for {x} in the context that holds
\* c: otherwise x is read as c, the bound looks constant, and the fact is
\* boxed.  The theorem is false: c is x in the first state only.

EXTENDS TLAPS

VARIABLE x

THEOREM ASSUME NEW c \in {x} PROVE [](c \in {x})
BY PTL

============================================================

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 21:1:21:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 21:1:21:3
    @status: failed
    @prover: ls4
    @meth: time-limit: 10
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW VARIABLE x,
           NEW CONSTANT c \in {x},
           TRUE 
    PROVE  [](c \in {x})

    @type: obligation
    @id: 2
    @loc: 21:4:21:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 21:4:21:7
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./new_bound_time_stest.tla", line 21, characters 1-2:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      NEW CONSTANT c \in 
                      {x},
                      PTL 
               PROVE  [](c \in {x})
    File "./new_bound_time_stest.tla", line 9, character 1 to line 23, character 60:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"new_bound_time_stest"`.
---*)
