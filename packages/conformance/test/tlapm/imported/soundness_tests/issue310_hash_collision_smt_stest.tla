(*---
description: 'tlapm''s soundness test issue310_hash_collision_smt_stest.tla states a false theorem, and tlapm still proves it: https://github.com/tlaplus/tlapm/issues/310.'
ref: test/soundness_tests/issue310_hash_collision_smt_stest.tla
features:
  - tlapm-test
  - tlapm-bug
mode: proof
outcome: proved
---*)
------------- MODULE issue310_hash_collision_smt_stest --------------

\* https://github.com/tlaplus/tlapm/issues/310
\* Abstracted terms are named "h" + the first five hex digits of the MD5
\* of their print, with no collision check.  md5("[]STATE_D33_") and
\* md5("[]STATE_E280_") both begin 4cb21, so []D33 and []E280 become the
\* same opaque constant.  The theorem is false: x = TRUE forever
\* satisfies []D33 but not []E280.

EXTENDS TLAPS

VARIABLE x

D33  == x
E280 == ~x

THEOREM []D33 => []E280
BY SMT

=====================================================================

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 27:1:27:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 27:1:27:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 27:4:27:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 27:4:27:7
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./issue310_hash_collision_smt_stest.tla", line 10, character 1 to line 29, character 69:
    [INFO]: All 2 obligations proved.
---*)
