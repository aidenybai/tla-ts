(*---
description: tlapm's soundness test recordeq_swap_stest.tla states a false theorem, so an obligation must fail.
ref: test/soundness_tests/recordeq_swap_stest.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
------------- MODULE recordeq_swap_stest --------------

\* Soundness control for `Encode.Rewrite.simpl_receq`.  Two record
\* constructors with equal domains but two field values transposed are
\* unequal in general, so the pass must pair fields by name, not by
\* position.  This obligation is invalid: SMT must report the negation
\* satisfiable (`sat`) and fail to prove it.  A soundness test passes iff
\* its obligation is not proved; were any backend to prove this, the
\* decomposition would be unsound.

EXTENDS TLAPS

THEOREM ASSUME NEW x,
               NEW y
        PROVE  [ foo |-> x, bar |-> y ] = [ foo |-> y, bar |-> x ]
BY SMT

=======================================================

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 24:1:24:3
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 24:1:24:3
    @status: failed
    @prover: smt
    @meth: time-limit: 5
    @reason: false
    @already: false
    @obl: 
    (* SMT failed with status = sat
     *)
    ASSUME NEW CONSTANT x,
           NEW CONSTANT y,
           TRUE 
    PROVE  [foo |-> x, bar |-> y] = [foo |-> y, bar |-> x]

    @type: obligation
    @id: 2
    @loc: 24:4:24:7
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 24:4:24:7
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./recordeq_swap_stest.tla", line 24, characters 1-2:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT x,
                      NEW CONSTANT y,
                      SMT 
               PROVE  [foo |-> x, bar |-> y] = [foo |-> y, bar |-> x]
    File "./recordeq_swap_stest.tla", line 9, character 1 to line 26, character 55:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"recordeq_swap_stest"`.
---*)
