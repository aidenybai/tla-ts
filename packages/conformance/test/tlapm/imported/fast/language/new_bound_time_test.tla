(*---
description: tlapm's own test fast/language/new_bound_time_test.tla.
ref: test/fast/language/new_bound_time_test.tla
features:
  - tlapm-test
mode: proof
outcome: proved
---*)
------------- MODULE new_bound_time_test --------------

\* Before PTL, NEW c \in {k} becomes NEW c and the fact c \in {k}.  The
\* time of this fact must be computed for {k} in the context that holds
\* c.  CONSTANT k is declared before VARIABLE x, so the unshifted index
\* of k lands on x and the bound looks state-dependent.  The fact must
\* still be boxed: c \in {k} holds in every state.

EXTENDS TLAPS

CONSTANT k
VARIABLE x

THEOREM ASSUME NEW c \in {k} PROVE [](c \in {k})
BY PTL

============================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 23:1:23:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 23:1:23:3
    @status: proved
    @prover: ls4
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 23:4:23:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 23:4:23:7
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./new_bound_time_test.tla", line 9, character 1 to line 25, character 60:
    [INFO]: All 2 obligations proved.
---*)
