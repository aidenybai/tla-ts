(*---
description: tlapm's own test bugs/quant_level_test.tla, which checks stderr status:failed.
ref: test/bugs/quant_level_test.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
---- MODULE quant_level_test ----
(*
The levels of quantifier bounds were ignored.
That lead to considering formulas as being constant level
leading to proofs passing were they must fail.
*)
VARIABLE v
I == \A y \in v: y = y
LEMMA ASSUME I PROVE I' OBVIOUS
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 17:25:17:32
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 17:25:17:32
    @status: failed
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW VARIABLE v,
           I 
    PROVE  I'

    @type: obligationsnumber
    @count: 1

    Zenon error: exhausted search space without finding a proof
    File "./quant_level_test.tla", line 17, characters 25-31:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE v,
                      I 
               PROVE  I'
    File "./quant_level_test.tla", line 9, character 1 to line 18, character 4:
    [ERROR]: 1/1 obligation failed.
    There were backend errors processing module `"quant_level_test"`.
---*)
