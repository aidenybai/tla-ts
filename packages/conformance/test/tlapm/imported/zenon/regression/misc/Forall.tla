(*---
description: Zenon's regression test zenon/regression/misc/Forall.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/misc/Forall.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
---- MODULE Forall ----

CONSTANTS i, j, P(_), Q(_)

THEOREM
  ASSUME
    i = j,
    \A i : P(i) => Q(j)
  PROVE
    P(i) => Q(i)
OBVIOUS


====================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 22:1:22:8
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 22:1:22:8
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./Forall.tla", line 12, character 1 to line 25, character 20:
    [INFO]: All 1 obligation proved.
---*)
