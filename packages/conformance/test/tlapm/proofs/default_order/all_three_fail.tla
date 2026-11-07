(*---
description: When SMT, Zenon and Isabelle all fail, the obligation fails with the last backend tried, Isabelle.
ref: src/params.ml#default_method
mode: proof
args: ['--solver', echo unknown]
outcome: failed
---*)
---- MODULE all_three_fail ----
EXTENDS Naturals
THEOREM ASSUME NEW a, NEW b PROVE a = b
  OBVIOUS
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 11:3:11:10
    @status: failed
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW CONSTANT a,
           NEW CONSTANT b
    PROVE  a = b

    @type: obligationsnumber
    @count: 1

    Zenon error: exhausted search space without finding a proof
    File "./all_three_fail.tla", line 11, characters 3-9:
    [ERROR]: Could not prove or check:
               ASSUME NEW CONSTANT a,
                      NEW CONSTANT b
               PROVE  a = b
    File "./all_three_fail.tla", line 8, character 1 to line 12, character 4:
    [ERROR]: 1/1 obligation failed.
    There were backend errors processing module `"all_three_fail"`.
---*)
