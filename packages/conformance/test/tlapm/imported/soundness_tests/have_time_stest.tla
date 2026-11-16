(*---
description: tlapm's soundness test have_time_stest.tla states a false theorem, so an obligation must fail.
ref: test/soundness_tests/have_time_stest.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
------------- MODULE have_time_stest --------------

\* HAVE x = 0 must not give the new fact x = 0 the time of the enclosing
\* scope, which is Always: PTL would receive it as [](x = 0) although it
\* holds only now.  The theorem is false for a behavior where x changes
\* from 0 to 1.

EXTENDS TLAPS

VARIABLE x

THEOREM x = 0 => (x = 0)'
<1> HAVE x = 0
<1>1. [](x = 0)
    BY PTL
<1> QED
    BY <1>1, PTL

============================================================

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 25:5:25:7
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 25:5:25:7
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 25:8:25:12
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 25:8:25:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 25:14:25:17
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 25:14:25:17
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 4
    @loc: 21:1:21:15
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 21:1:21:15
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 5
    @loc: 21:1:21:15
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 21:1:21:15
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 6
    @loc: 23:5:23:7
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 23:5:23:7
    @status: failed
    @prover: ls4
    @meth: time-limit: 10
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW VARIABLE x,
           x = 0 (* non-[] *),
           TRUE (* non-[] *)
    PROVE  [](x = 0)

    @type: obligation
    @id: 7
    @loc: 23:8:23:11
    @status: to be proved

    @type: obligation
    @id: 7
    @loc: 23:8:23:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 7

    File "./have_time_stest.tla", line 23, characters 5-6:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      x = 0 ,
                      PTL 
               PROVE  [](x = 0)
    File "./have_time_stest.tla", line 9, character 1 to line 27, character 60:
    [ERROR]: 1/7 obligations failed.
    There were backend errors processing module `"have_time_stest"`.
---*)
