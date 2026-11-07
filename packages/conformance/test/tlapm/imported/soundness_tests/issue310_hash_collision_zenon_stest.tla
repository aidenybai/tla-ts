(*---
description: 'tlapm''s soundness test issue310_hash_collision_zenon_stest.tla states a false theorem, and tlapm still proves it: https://github.com/tlaplus/tlapm/issues/310.'
ref: test/soundness_tests/issue310_hash_collision_zenon_stest.tla
features:
  - tlapm-test
  - tlapm-bug
mode: proof
outcome: proved
---*)
------------- MODULE issue310_hash_collision_zenon_stest --------------

\* https://github.com/tlaplus/tlapm/issues/310
\* Zenon variant of issue310_hash_collision_smt_stest: the colliding name
\* is produced by the shared front end, not by the SMT encoding.

EXTENDS TLAPS

VARIABLE x

D33  == x
E280 == ~x

THEOREM []D33 => []E280
BY Zenon

=======================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 24:1:24:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 24:1:24:3
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 24:4:24:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 24:4:24:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./issue310_hash_collision_zenon_stest.tla", line 10, character 1 to line 26, character 71:
    [INFO]: All 2 obligations proved.
---*)
