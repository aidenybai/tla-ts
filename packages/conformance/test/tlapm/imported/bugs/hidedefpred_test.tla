(*---
description: tlapm's own test bugs/hidedefpred_test.tla, which checks stderr status:failed.
ref: test/bugs/hidedefpred_test.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
---- MODULE hidedefpred_test ----

EXTENDS TLAPS

C == TRUE
HIDE DEF C

(** The following result might be solved if C is given the type bool.
    This must not happen, as C's defn is hidden.
*)
THEOREM C = TRUE \/ C = FALSE
    OBVIOUS

====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 20:5:20:12
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 20:5:20:12
    @status: failed
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: false
    @already: false
    @obl: 
    C = TRUE \/ C = FALSE

    @type: obligationsnumber
    @count: 1

    Zenon error: exhausted search space without finding a proof
    File "./hidedefpred_test.tla", line 20, characters 5-11:
    [ERROR]: Could not prove or check:
               C = TRUE \/ C = FALSE
    File "./hidedefpred_test.tla", line 9, character 1 to line 22, character 4:
    [ERROR]: 1/1 obligation failed.
    There were backend errors processing module `"hidedefpred_test"`.
---*)
