(*---
description: 'tlapm''s soundness test issue310_hash_collision_ptl_stest.tla states a false theorem, and tlapm still proves it: https://github.com/tlaplus/tlapm/issues/310.'
ref: test/soundness_tests/issue310_hash_collision_ptl_stest.tla
features:
  - tlapm-test
  - tlapm-bug
mode: proof
outcome: proved
---*)
------------- MODULE issue310_hash_collision_ptl_stest --------------

\* https://github.com/tlaplus/tlapm/issues/310
\* LS4 atoms are named like abstracted terms, by a 20-bit MD5 prefix of
\* their print.  md5("STATE_R63_") and md5("STATE_R699_") both begin
\* 0823c, so LS4 receives the single atom h0823c for R63 and R699.  The
\* theorem is false: it does not hold in a state with y = TRUE.

EXTENDS TLAPS

VARIABLE y

R63  == y
R699 == ~y

THEOREM R63 => R699
BY PTL

=====================================================================

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

    File "./issue310_hash_collision_ptl_stest.tla", line 10, character 1 to line 28, character 69:
    [INFO]: All 2 obligations proved.
---*)
