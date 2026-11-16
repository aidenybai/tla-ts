(*---
description: tlapm's soundness test case_time_stest.tla states a false theorem, so an obligation must fail.
ref: test/soundness_tests/case_time_stest.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
------------- MODULE case_time_stest --------------

\* CASE x = 0 must not give the case assumption x = 0 the time of the
\* enclosing scope, which is Always: PTL would receive it as [](x = 0)
\* although it holds only now.  The theorem is false for a behavior where
\* x changes from 0 to 1.

EXTENDS TLAPS

VARIABLE x

THEOREM x = 0 => (x = 0)'
<1>1. CASE x = 0
    <2>1. [](x = 0)
        BY <1>1, PTL
    <2> QED
        BY <2>1, PTL
<1> QED
    BY <1>1

============================================================

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 27:5:27:7
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 27:5:27:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 27:8:27:12
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 27:8:27:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 25:9:25:11
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 25:9:25:11
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 4
    @loc: 25:12:25:16
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 25:12:25:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 5
    @loc: 25:18:25:21
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 25:18:25:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 6
    @loc: 23:9:23:11
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 23:9:23:11
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
    @loc: 23:12:23:16
    @status: to be proved

    @type: obligation
    @id: 7
    @loc: 23:12:23:16
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 8
    @loc: 23:18:23:21
    @status: to be proved

    @type: obligation
    @id: 8
    @loc: 23:18:23:21
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 8

    File "./case_time_stest.tla", line 23, characters 9-10:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      <1>1 ,
                      PTL 
               PROVE  [](x = 0)
    File "./case_time_stest.tla", line 9, character 1 to line 29, character 60:
    [ERROR]: 1/8 obligations failed.
    There were backend errors processing module `"case_time_stest"`.
---*)
