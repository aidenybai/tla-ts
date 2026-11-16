(*---
description: tlapm's soundness test use_time_stest.tla states a false theorem, so an obligation must fail.
ref: test/soundness_tests/use_time_stest.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
------------- MODULE use_time_stest --------------

\* USE b proves b from the assumption, which holds only now, so the fact
\* b must not get the time Always just because b is not the name of a
\* fact: PTL would receive it as []b.  The theorem is false for a
\* behavior where b is TRUE and then FALSE.

EXTENDS TLAPS

VARIABLE b

THEOREM ASSUME b PROVE []b
<1> USE b
<1> QED
    BY PTL

============================================================

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 23:5:23:7
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 23:5:23:7
    @status: failed
    @prover: ls4
    @meth: time-limit: 10
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW VARIABLE b,
           b (* non-[] *),
           b (* non-[] *),
           TRUE (* non-[] *)
    PROVE  []b

    @type: obligation
    @id: 2
    @loc: 23:8:23:11
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 23:8:23:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 21:9:21:10
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 21:9:21:10
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 3

    File "./use_time_stest.tla", line 23, characters 5-6:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE b,
                      b ,
                      b ,
                      PTL 
               PROVE  []b
    File "./use_time_stest.tla", line 9, character 1 to line 25, character 60:
    [ERROR]: 1/3 obligations failed.
    There were backend errors processing module `"use_time_stest"`.
---*)
