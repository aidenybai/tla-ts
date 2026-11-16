(*---
description: Zenon's regression test zenon/regression/backend/testsubset.tla, whose proofs tlapm must check with Zenon.
ref: zenon/regression/backend/testsubset.tla
features:
  - zenon-test
mode: proof
outcome: proved
args:
  - '--method'
  - zenon
---*)
---- MODULE testsubset ----

THEOREM test ==
  ASSUME NEW A, NEW B,
         A \subseteq B
  PROVE \A x : x \in A => x \in B
OBVIOUS

====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 18:1:18:8
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 18:1:18:8
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligationsnumber
    @count: 1

    File "./testsubset.tla", line 12, character 1 to line 20, character 4:
    [INFO]: All 1 obligation proved.
---*)
