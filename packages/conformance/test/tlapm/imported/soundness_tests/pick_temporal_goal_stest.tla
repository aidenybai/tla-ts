(*---
description: tlapm's soundness test pick_temporal_goal_stest.tla states a false theorem, so an obligation must fail.
ref: test/soundness_tests/pick_temporal_goal_stest.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
------------- MODULE pick_temporal_goal_stest --------------

\* PICK must not add its predicate as a fact with the time of the
\* enclosing goal.  The goal is temporal, so c = x would count as holding
\* at all times and PTL would box it.  The theorem is false: x may change,
\* and no constant equals x in every state.  SANY accepts the proof.

EXTENDS TLAPS

VARIABLE x

THEOREM \E c : [](c = x)
<1> PICK c : c = x
    OBVIOUS
<1>1. [](c = x)
    BY PTL
<1> QED
    BY <1>1

============================================================

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 26:5:26:7
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 26:5:26:7
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 26:8:26:12
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 26:8:26:12
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligation
    @id: 3
    @loc: 22:5:22:12
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 22:5:22:12
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 5
    @loc: 24:5:24:7
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 24:5:24:7
    @status: failed
    @prover: ls4
    @meth: time-limit: 10
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW VARIABLE x,
           NEW CONSTANT c,
           c = x (* non-[] *),
           TRUE (* non-[] *)
    PROVE  [](c = x)

    @type: obligation
    @id: 6
    @loc: 24:8:24:11
    @status: to be proved

    @type: obligation
    @id: 6
    @loc: 24:8:24:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 5

    File "./pick_temporal_goal_stest.tla", line 24, characters 5-6:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      NEW CONSTANT c,
                      c = x ,
                      PTL 
               PROVE  [](c = x)
    File "./pick_temporal_goal_stest.tla", line 9, character 1 to line 28, character 60:
    [ERROR]: 1/5 obligations failed.
    There were backend errors processing module `"pick_temporal_goal_stest"`.
---*)
