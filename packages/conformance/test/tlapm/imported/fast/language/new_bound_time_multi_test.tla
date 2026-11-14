(*---
description: tlapm's own test fast/language/new_bound_time_multi_test.tla.
ref: test/fast/language/new_bound_time_multi_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
------------- MODULE new_bound_time_multi_test --------------

\* Expanding NEW a \in {k} inserts the declaration of a and the fact
\* a \in {k}.  The later domain {a} must be shifted by that extra fact
\* as well as by b, which is what compose (shift 1) s does.  A shift of
\* only 1 leaves a's De Bruijn index on the fact, so b \in {a} is not
\* boxed.  The theorem is valid: b \in {a} holds in every state.

EXTENDS TLAPS

CONSTANT k
VARIABLE x

THEOREM
  ASSUME NEW a \in {k},
         NEW b \in {a}
  PROVE [](b \in {a})
BY PTL

============================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 26:1:26:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 26:1:26:3
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

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
    @count: 2

    File "./new_bound_time_multi_test.tla", line 9, character 1 to line 28, character 60:
    [INFO]: All 2 obligations proved.
---*)
