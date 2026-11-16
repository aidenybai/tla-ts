(*---
description: tlapm's own test bugs/noteqfalse_test.tla, which checks stderr status:failed.
ref: test/bugs/noteqfalse_test.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
---- MODULE noteqfalse_test ----

EXTENDS TLAPS

(** 'x \/ ~ x' is a theorem of TLA+, but 'x = TRUE \/ x = FALSE' is
    inconsistent, because it would imply that BOOLEAN is the set of all sets.
    Thus the theorem below cannot be true.
*)

THEOREM ASSUME NEW x
        PROVE ~ x => x = FALSE
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
    ASSUME NEW CONSTANT x
    PROVE  ~x => x = FALSE

    @type: obligationsnumber
    @count: 1

    Zenon error: exhausted search space without finding a proof
    File "./noteqfalse_test.tla", line 20, characters 5-11:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT x
               PROVE  ~x => x = FALSE
    File "./noteqfalse_test.tla", line 9, character 1 to line 22, character 4:
    [ERROR]: 1/1 obligation failed.
    There were backend errors processing module `"noteqfalse_test"`.
---*)
